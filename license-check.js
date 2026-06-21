/* ============================================================
   AN Psixoloji — Universal Lisenziya Yoxlama Modulu
   Bütün qiymətləndirmə/test layihələri bunu import edir.
   localStorage + statik key bazası ilə işləyir.
   Firebase qoşulanda yalnız LICENSE.checkKey() dəyişər.
============================================================ */
(function(){
  var TOOL_ID = document.currentScript.getAttribute('data-tool') || 'test';

  var LICENSE = {
    storageKey: 'an_license_' + TOOL_ID,

    // ---- Firebase qoşulanda dəyişəcək hissə ----
    checkKey: function(key){
      var db = window.LICENSE_DB || {};
      var entry = db[key];
      if (!entry) return { valid:false };
      if (entry.toolId !== TOOL_ID && entry.toolId !== 'all') return { valid:false };
      if (entry.expiresAt && Date.now() > entry.expiresAt) return { valid:false, expired:true };
      return { valid:true, entry: entry };
    },
    // ------------------------------------------

    isActivated: function(){
      return localStorage.getItem(this.storageKey) === 'active';
    },

    activate: function(key){
      var result = this.checkKey(key.trim());
      if (result.valid) {
        localStorage.setItem(this.storageKey, 'active');
        localStorage.setItem(this.storageKey + '_key', key.trim());
        return true;
      }
      return false;
    },

    texts: {
      az: { 
        title:"Lisenziya tələb olunur", 
        desc:"Bu aləti tam istifadə etmək üçün lisenziya açarını daxil edin.", 
        placeholder:"Lisenziya açarını daxil edin", 
        btn:"Aktivləşdir", 
        error:"Açar yanlışdır və ya bu alət üçün deyil.", 
        expired:"Lisenziyanın müddəti bitib.", 
        contact:"Lisenziya almaq üçün əlaqə saxlayın", 
        success:"Aktivləşdirildi!" 
      },
      en: { 
        title:"License Required", 
        desc:"Enter your license key to unlock full access to this tool.", 
        placeholder:"Enter license key", 
        btn:"Activate", 
        error:"Invalid key or not valid for this tool.", 
        expired:"License has expired.", 
        contact:"Contact us to get a license", 
        success:"Activated!" 
      },
      ru: { 
        title:"Требуется лицензия", 
        desc:"Введите лицензионный ключ для полного доступа к инструменту.", 
        placeholder:"Введите лицензионный ключ", 
        btn:"Активировать", 
        error:"Неверный ключ или не подходит для этого инструмента.", 
        expired:"Срок лицензии истёк.", 
        contact:"Свяжитесь с нами для получения лицензии", 
        success:"Активировано!" 
      }
    },

    getLang: function(){
      try { return (window.currentLang || localStorage.getItem('an_lang') || 'az'); } 
      catch(e){ return 'az'; }
    },

    lockContent: function(contentSelector){
      var content = document.querySelector(contentSelector);
      if (!content) return;
      var t = this.texts[this.getLang()] || this.texts.az;

      content.style.filter = 'blur(8px)';
      content.style.userSelect = 'none';
      content.style.pointerEvents = 'none';
      content.setAttribute('aria-hidden', 'true');

      var overlay = document.createElement('div');
      overlay.className = 'license-overlay';
      overlay.innerHTML =
        '<div class="license-box">' +
          '<div class="license-icon">🔒</div>' +
          '<h3>' + t.title + '</h3>' +
          '<p>' + t.desc + '</p>' +
          '<input type="text" id="licenseKeyInput" placeholder="' + t.placeholder + '" autocomplete="off">' +
          '<button id="licenseActivateBtn" class="btn btn-accent">' + t.btn + '</button>' +
          '<div id="licenseMsg" class="license-msg"></div>' +
          '<a href="https://instagram.com/s_akhundoff" target="_blank" rel="noopener" class="license-contact">' + t.contact + ' →</a>' +
        '</div>';

      var styleTag = document.createElement('style');
      styleTag.textContent =
        '.license-overlay{position:fixed;inset:0;display:flex;align-items:center;justify-content:center;z-index:9999;background:rgba(0,0,0,.35);backdrop-filter:blur(2px);padding:20px}' +
        '.license-box{background:#fff;border-radius:16px;padding:32px 28px;max-width:380px;width:100%;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.25)}' +
        '.license-icon{font-size:40px;margin-bottom:8px}' +
        '.license-box h3{margin:0 0 8px;font-size:20px;color:var(--accent,#6A0000)}' +
        '.license-box p{margin:0 0 18px;color:#555;font-size:14px;line-height:1.5}' +
        '.license-box input{width:100%;padding:12px 14px;border:1px solid #ddd;border-radius:10px;font-size:14px;margin-bottom:12px;box-sizing:border-box;text-align:center}' +
        '.license-box .btn{width:100%;padding:12px;border-radius:10px;font-size:15px;cursor:pointer;border:none;background:var(--accent,#6A0000);color:#fff}' +
        '.license-msg{margin-top:10px;font-size:13px;min-height:18px}' +
        '.license-msg.error{color:#c0392b}' +
        '.license-msg.success{color:#27ae60}' +
        '.license-contact{display:block;margin-top:16px;font-size:13px;color:var(--accent,#6A0000);text-decoration:none}';
      document.head.appendChild(styleTag);
      document.body.appendChild(overlay);

      var self = this;
      document.getElementById('licenseActivateBtn').addEventListener('click', function(){
        var key = document.getElementById('licenseKeyInput').value;
        var msg = document.getElementById('licenseMsg');
        var result = self.checkKey(key.trim());
        if (result.valid) {
          self.activate(key);
          msg.className = 'license-msg success';
          msg.textContent = t.success;
          setTimeout(function(){ location.reload(); }, 600);
        } else {
          msg.className = 'license-msg error';
          msg.textContent = result.expired ? t.expired : t.error;
        }
      });

      document.getElementById('licenseKeyInput').addEventListener('keydown', function(e){
        if (e.key === 'Enter') document.getElementById('licenseActivateBtn').click();
      });
    },

    init: function(contentSelector){
      if (!this.isActivated()) {
        this.lockContent(contentSelector || 'body');
      }
    }
  };

  window.LICENSE = LICENSE;
})();
