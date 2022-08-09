window.onload = () => {

    //disable spying for people who don't want it
    if (!(navigator.doNotTrack == "1" || navigator.doNotTrack == "yes" || window.doNotTrack == "1"))
    {
        var glowScript = document.createElement("script");
        glowScript.src = "https://www.googletagmanager.com/gtag/js?id=G-LB4FV46CJK";
        glowScript.async = true;

        document.body.appendChild(glowScript);

        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        gtag('js', new Date());

        gtag('config', 'G-LB4FV46CJK');
    }
};