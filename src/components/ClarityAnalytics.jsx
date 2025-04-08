import { useEffect } from 'react';

function ClarityAnalytics() {
  useEffect(() => {
    // Sadece production ortamında yükle
    if (import.meta.env.MODE === 'production') {
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "r0txvclzvz");
      
      console.log('Microsoft Clarity yüklendi - üretim ortamı');
    } else {
      console.log('Microsoft Clarity yüklenmedi - geliştirme ortamı');
    }
  }, []);

  return null;
}

export default ClarityAnalytics;