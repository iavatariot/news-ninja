import React, { useEffect, useRef } from 'react';

let globalAdsPushed = false; // Flag globale per single push
let pushTimeout = null; // Timer globale per delay

const AdBanner = ({ 
  slot = "7994145903", // Sostituisci con slot REALI da AdSense
  format = "auto", 
  style = {}, 
  fullWidthResponsive = true,
  testMode = true // Per data-adtest="on" in dev
}) => {
  const insRef = useRef(null);
  const componentKey = useRef(`${slot}-${Date.now()}-${Math.random()}`); // Unique key per component

  useEffect(() => {
    // Cleanup precedente timeout
    if (pushTimeout) {
      clearTimeout(pushTimeout);
      pushTimeout = null;
    }

    // Conta quanti AdBanner sono visibili (per single push dopo tutti render)
    const allAds = document.querySelectorAll('.adsbygoogle');
    const visibleAds = Array.from(allAds).filter(ad => {
      const rect = ad.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });

    // Push globale solo quando tutti <ins> sono visibili e non già pushed
    if (visibleAds.length > 0 && !globalAdsPushed && !pushTimeout) {
      pushTimeout = setTimeout(() => {
        if (!globalAdsPushed) {
          try {
            console.log(`AdSense GLOBAL PUSH - Found ${visibleAds.length} visible slots`);
            (window.adsbygoogle = window.adsbygoogle || []).push({});
            globalAdsPushed = true;
            console.log('✅ AdSense global push completed successfully');
          } catch (error) {
            console.warn('⚠️ AdSense global push failed (already loaded?):', error.message);
            globalAdsPushed = true; // Marca come fatto per evitare retry
          }
        }
      }, 200); // Delay 200ms per DOM completo
    }

    // Cleanup su unmount
    return () => {
      if (pushTimeout) {
        clearTimeout(pushTimeout);
        pushTimeout = null;
      }
      // Reset global flag quando tutti AdBanner sono unmounted (route change)
      const remainingAds = document.querySelectorAll('.adsbygoogle');
      if (remainingAds.length === 0) {
        globalAdsPushed = false;
        console.log('🔄 AdSense global flag reset (no ads left)');
      }
    };
  }, [slot, componentKey.current]); // Dipende da unique key

  // Verifica dimensioni per debug
  useEffect(() => {
    if (insRef.current) {
      const rect = insRef.current.getBoundingClientRect();
      if (rect.width === 0) {
        console.warn(`⚠️ AdBanner slot ${slot} has width=0 - Check CSS/Grid`);
      }
    }
  }, []);

  return (
    <div 
      style={{ 
        minWidth: '320px', // Min width richiesto per responsive ads
        maxWidth: '100%', 
        margin: '20px auto', 
        textAlign: 'center',
        visibility: 'visible',
        display: 'block',
        ...style 
      }}
    >
      <ins
        ref={insRef}
        className="adsbygoogle"
        style={{ 
          display: 'block', 
          width: '100%', 
          minHeight: '50px' // Previene layout shift
        }}
        data-ad-client="ca-pub-9461341218416886"
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={fullWidthResponsive ? "true" : "false"}
        data-adtest={testMode ? "on" : undefined} // Test mode per dev
      />
    </div>
  );
};

// Reset globale quando serve (es. route change)
const resetAdSenseGlobal = () => {
  globalAdsPushed = false;
  if (pushTimeout) {
    clearTimeout(pushTimeout);
    pushTimeout = null;
  }
  console.log('🔄 AdSense global state reset');
};

AdBanner.reset = resetAdSenseGlobal; // Esporta per uso esterno

export default AdBanner;
