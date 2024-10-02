//Pan and Zoom image
class PZImage
{
    constructor(image, parent, maxZoom)
    {
        this.image = image;
        this.parent = parent; //canvas the image is on
        this.viewTL = [0, 0];
        this.zoom = 1; //more zoom means more restricted view area
        this.maxZoom = maxZoom;
        this.viewBR = [image.width / this.zoom, image.height / this.zoom];

        //TL and BR are in image pixel space

        this.mouseHeld = false;
        this.prevMouse = [0, 0];
        this.prevMouseClick = [-1, -1];
    }

    draw(context)
    {
        // context.clearRect(0, 0, this.parent.width, this.parent.height);  //shouldn't need to clear since image can never be smaller than its canvas, but if needed it should be done here

        //TL and BR act as corners of a view frame moving over the image. whatever is in the view
        //the corners of the view frame, and everything within them, match onto the canvas
        context.drawImage(this.image,
            this.viewTL[0], this.viewTL[1], this.viewBR[0] - this.viewTL[0], this.viewBR[1] - this.viewTL[1],
            0, 0, this.parent.width, this.parent.height);
    }


    changeZoom(dir)
    {
        let mouseBefore = this.screenToImagePos(this.prevMouse[0], this.prevMouse[1]);

        this.zoom *= Math.pow(1.25, dir);
        this.zoom = Math.max(Math.min(this.zoom, this.maxZoom), 1);

        this.viewBR[0] = this.viewTL[0] + this.image.width / this.zoom;
        this.viewBR[1] = this.viewTL[1] + this.image.height / this.zoom;

        let mouseAfter = this.screenToImagePos(this.prevMouse[0], this.prevMouse[1]);
        let d = [mouseAfter[0] - mouseBefore[0], mouseAfter[1] - mouseBefore[1]];

        this.panView(d);
        this.restrictView();
    }

    changeZoomCentre(delta)
    {
        //zoom to cenre rather than mouse pos
        let parentDims = this.parent.getBoundingClientRect();
        let mouseBefore = this.screenToImagePos(parentDims.x + parentDims.width / 2, parentDims.y + parentDims.height / 2);

        this.zoom += 0.5 * delta;
        this.zoom = Math.max(Math.min(this.zoom, this.maxZoom), 1);

        this.viewBR[0] = this.viewTL[0] + this.image.width / this.zoom;
        this.viewBR[1] = this.viewTL[1] + this.image.height / this.zoom;

        let mouseAfter = this.screenToImagePos(parentDims.x + parentDims.width / 2, parentDims.y + parentDims.height / 2);
        let d = [mouseAfter[0] - mouseBefore[0], mouseAfter[1] - mouseBefore[1]];

        this.panView(d);
        this.restrictView();
    }

    panView(delta)
    {
        this.viewTL[0] -= delta[0];
        this.viewTL[1] -= delta[1];
        this.viewBR[0] -= delta[0];
        this.viewBR[1] -= delta[1];
    }

    restrictView()
    {
        //stop view frame from seeing outside of image.
        //image will basically stick to the side when it shouldn't move any further.
        //tracking the frame in image pixel space makes this very easy.
        //it will never be possible for opposite sides to both be out of bounds as long as the minimum zoom is 1x.

        let delta = [0,0];
        if (this.viewTL[0] < 0) delta[0] = this.viewTL[0];
        if (this.viewTL[1] < 0) delta[1] = this.viewTL[1];
        if (this.viewBR[0] > this.image.width) delta[0] = this.viewBR[0] - this.image.width;
        if (this.viewBR[1] > this.image.height) delta[1] = this.viewBR[1] - this.image.height;

        this.panView(delta);
    }

    resetPos()
    {
        this.zoom = 1;
        this.viewTL = [0, 0];
        this.viewBR = [this.image.width / this.zoom, this.image.height / this.zoom];
    }

    screenToImagePos(x, y)
    {
        /*
        input x and y in viewport
        v to canvas pixels:
            offset to match canvas 0,0:
                v - canvasPos
            get 1 viewport pixel in terms of canvas pixels:
                canvas pixels per viewport pixel cpv =  canvas.width / canvas.boundingrect.width
            multiply v by cpv to get c:
                cx = vx * cpv
                cy = vy * cpv
        
        c to image pixel:
            get 1 image pixel in terms of canvas pixels:
                if canvas has half pixel density of image, then 1 canvas pixel = 2 image pixels.
                then with e.g. zoom = 3, image pixels per canvas pixels goes down by 3. so (i / c) / z -> (i / c) * (1 / z) -> i / (c * z)
                ipc = imagePixels / (canvasPixels * zoom)
            ix = cx / zoom
            iy = cy / zoom

        subtract image offset to get relative to image 0,0:
            image offset = -view offset
            i.e. +viewTL = -offset
            ix += viewtl[0]
            iy += viewtl[1]
        */

        let mapBounds = this.parent.getBoundingClientRect();
        let canvasZeroed = [x - mapBounds.x, y - mapBounds.y];

        //mapbounds width is in screen pixels, parent.width is in canvas pixels
        let cpv = this.parent.width / mapBounds.width;
        let c = [canvasZeroed[0] * cpv, canvasZeroed[1] * cpv];

        let ipc = this.image.width / (this.parent.width * this.zoom);
        let i = [c[0] * ipc, c[1] * ipc];

        return [i[0] + this.viewTL[0], i[1] + this.viewTL[1]];
    }

    imageToScreenPos(x, y)
    {
        //reverse of screen to world
        let mapBounds = this.parent.getBoundingClientRect();
        
        let i = [x - this.viewTL[0], y - this.viewTL[1]];

        let ipc = this.image.width / (this.parent.width * this.zoom);
        let c = [i[0] / ipc, i[1] / ipc];

        let cpv = this.parent.width / mapBounds.width;
        let canvasZeroed = [c[0] / cpv, c[1] / cpv];

        return [canvasZeroed[0] + mapBounds.x, canvasZeroed[1] + mapBounds.y];
    }

    mouseDown(event)
    {
        this.mouseHeld = true;
        this.prevMouse = [event.x, event.y];
        this.mouseDownPos = [event.x, event.y];
    }

    mouseUp(event)
    {
        this.mouseHeld = false;

        //if mouse moved less than certain amount
        //consider it a click rather than a drag
        let currentMouse = [event.x, event.y];
        if (Math.abs(currentMouse[0] - this.mouseDownPos[0]) < 10 && Math.abs(currentMouse[1] - this.mouseDownPos[1]) < 10)
        {
            this.prevMouseClick = currentMouse;
        }
    }

    mouseMoved(event)
    {
        var currentMouse = [event.x, event.y];

        if (this.mouseHeld)
        {
            let currentMouseWorld = this.screenToImagePos(currentMouse[0], currentMouse[1]);
            let prevMouseWorld = this.screenToImagePos(this.prevMouse[0], this.prevMouse[1]);

            let delta = [currentMouseWorld[0] - prevMouseWorld[0], currentMouseWorld[1] - prevMouseWorld[1]];
            this.panView(delta);
            this.restrictView();
        }

        this.prevMouse = currentMouse;
    }

    scrolled(event)
    {
        this.prevMouse = [event.x, event.y];

        const sens = 0.05;

        //smooth scroll wheels and touchpad gestures want to do lots of little scrolls by a little amount.
        //chunky scroll wheels want to scroll in fewer bigger amounts.
        //sens was tuned to feel good on my laptop touchpad, but on chunky scroll wheels it jumps immediately to fully
        //zoomed in or out.
        //so cap the max zoom amount so that it takes at least a few scroll clicks to reach max zoom no matter the
        //scroll method. (could allow for user to set scroll sens, but having to return to home screen to change it is
        //terrible and redesigning the settings to be in the main game screen is not worth it right now).
        //in conclusion, this should give a good default that works ok for everyone
        const zoomMag = Math.min(Math.abs(event.deltaY * sens), 1);
        
        //deltaY is positive for scroll down, which should zoom out. zooming out is considered a negative direction by zoom code.
        const zoomDir = -Math.sign(event.deltaY);

        this.changeZoom(zoomMag * zoomDir);
    }
}