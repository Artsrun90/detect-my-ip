class IPChecker {
    constructor() {
        this.init();
    }

    init() {
        this.loadIPInfo();
        this.setupEventListeners();
        this.setActiveNavLink();
    }

    async loadIPInfo() {
        // Проверяем, есть ли элементы для отображения IP информации
        const ipv4Element = document.getElementById('ipv4');
        const ipv6Element = document.getElementById('ipv6');
        
        if (!ipv4Element && !ipv6Element) {
            // Если нет элементов для отображения IP, просто выходим
            return;
        }

        try {
            this.showLoading();

            // Список API для получения IP информации
            const apis = [
                'https://api.ipify.org?format=json',
                'https://ipinfo.io/json',
                'https://api64.ipify.org?format=json',
                'https://httpbin.org/ip'
            ];

            let data = null;
            
            // Пробуем каждый API по очереди
            for (const api of apis) {
                try {
                    const response = await fetch(api);
                    if (response.ok) {
                        data = await response.json();
                        
                        // Нормализуем данные в зависимости от API
                        if (api.includes('ipify')) {
                            data = {
                                ip: data.ip,
                                ipv6: data.ipv6 || null,
                                city: null,
                                country_name: null,
                                org: null,
                                timezone: null
                            };
                            
                            // Если ipify вернул только IP, попробуем получить геолокацию отдельно
                            if (!data.city && !data.country_name) {
                                try {
                                    const geoResponse = await fetch('https://ipinfo.io/json');
                                    if (geoResponse.ok) {
                                        const geoData = await geoResponse.json();
                                        data.city = geoData.city || null;
                                        data.country_name = geoData.country || null;
                                        data.org = geoData.org || null;
                                        data.timezone = geoData.timezone || null;
                                    }
                                } catch (e) {
                                    // Игнорируем ошибки геолокации
                                }
                            }
                        } else if (api.includes('ipinfo')) {
                            data = {
                                ip: data.ip,
                                ipv6: null,
                                city: data.city || null,
                                country_name: data.country || null,
                                org: data.org || null,
                                timezone: data.timezone || null
                            };
                        } else if (api.includes('httpbin')) {
                            data = {
                                ip: data.origin,
                                ipv6: null,
                                city: null,
                                country_name: null,
                                org: null,
                                timezone: null
                            };
                        }
                        
                        break; // Если успешно получили данные, выходим из цикла
                    }
                } catch (e) {
                    continue; // Пробуем следующий API
                }
            }

            if (!data) {
                throw new Error('All APIs failed');
            }

            // Если IPv6 не найден, пробуем получить его отдельно
            if (!data.ipv6) {
                try {
                    // Сначала пробуем WebRTC для IPv6
                    const ipv6FromWebRTC = await this.getIPv6FromWebRTC();
                    if (ipv6FromWebRTC) {
                        data.ipv6 = ipv6FromWebRTC;
                    } else {
                        // Если WebRTC не сработал, пробуем только рабочие API
                        const ipv6Apis = [
                            'https://api64.ipify.org?format=json',
                            'https://api.ipify.org?format=json'
                        ];

                        for (const api of ipv6Apis) {
                            try {
                                const apiResponse = await fetch(api);
                                if (apiResponse.ok) {
                                    const apiData = await apiResponse.json();
                                    
                                    if (apiData.ip && this.isIPv6(apiData.ip)) {
                                        data.ipv6 = apiData.ip;
                                        break;
                                    }
                                }
                            } catch (e) {
                                continue;
                            }
                        }
                    }
                } catch (e) {
                    // Если все методы не сработали, оставляем IPv6 как undefined
                }
            }

            this.displayIPInfo(data);
        } catch (error) {
            this.showError();
        }
    }

    showLoading() {
        const detectingText = 'Detecting...';
        const ipv4Element = document.getElementById('ipv4');
        const ipv6Element = document.getElementById('ipv6');
        const cityElement = document.getElementById('city');
        const countryElement = document.getElementById('country');
        const ispElement = document.getElementById('isp');
        const timezoneElement = document.getElementById('timezone');

        if (ipv4Element) ipv4Element.textContent = detectingText;
        if (ipv6Element) ipv6Element.textContent = detectingText;
        if (cityElement) cityElement.textContent = detectingText;
        if (countryElement) countryElement.textContent = detectingText;
        if (ispElement) ispElement.textContent = detectingText;
        if (timezoneElement) timezoneElement.textContent = detectingText;
    }

    displayIPInfo(data) {
        const notDeterminedText = 'Not determined';
        const notSupportedText = 'Not supported';
        
        const ipv4Element = document.getElementById('ipv4');
        const ipv6Element = document.getElementById('ipv6');
        const cityElement = document.getElementById('city');
        const countryElement = document.getElementById('country');
        const ispElement = document.getElementById('isp');
        const timezoneElement = document.getElementById('timezone');

        if (ipv4Element) ipv4Element.textContent = data.ip || notDeterminedText;
        if (ipv6Element) ipv6Element.textContent = data.ipv6 || notSupportedText;
        if (cityElement) cityElement.textContent = data.city || notDeterminedText;
        if (countryElement) countryElement.textContent = data.country_name || notDeterminedText;
        if (ispElement) ispElement.textContent = data.org || notDeterminedText;
        if (timezoneElement) timezoneElement.textContent = data.timezone || notDeterminedText;
    }

    showError() {
        const loadingErrorText = 'Loading error';
        const ipv4Element = document.getElementById('ipv4');
        const ipv6Element = document.getElementById('ipv6');
        const cityElement = document.getElementById('city');
        const countryElement = document.getElementById('country');
        const ispElement = document.getElementById('isp');
        const timezoneElement = document.getElementById('timezone');

        if (ipv4Element) ipv4Element.textContent = loadingErrorText;
        if (ipv6Element) ipv6Element.textContent = loadingErrorText;
        if (cityElement) cityElement.textContent = loadingErrorText;
        if (countryElement) countryElement.textContent = loadingErrorText;
        if (ispElement) ispElement.textContent = loadingErrorText;
        if (timezoneElement) timezoneElement.textContent = loadingErrorText;
    }

    setupEventListeners() {
        // Копирование IP адресов (только если элементы существуют)
        const copyIpv4 = document.getElementById('copyIpv4');
        if (copyIpv4) {
            copyIpv4.addEventListener('click', () => {
                this.copyToClipboard('ipv4');
            });
        }

        const copyIpv6 = document.getElementById('copyIpv6');
        if (copyIpv6) {
            copyIpv6.addEventListener('click', () => {
                this.copyToClipboard('ipv6');
            });
        }

        // IP Lookup (только если элемент существует)
        const ipLookupBtn = document.getElementById('ipLookupBtn');
        if (ipLookupBtn) {
            ipLookupBtn.addEventListener('click', () => {
                this.performIPLookup();
            });
        }

        // DNS Lookup (только если элемент существует)
        const dnsLookupBtn = document.getElementById('dnsLookupBtn');
        if (dnsLookupBtn) {
            dnsLookupBtn.addEventListener('click', () => {
                this.performDNSLookup();
            });
        }

        // Proxy Check (только если элемент существует)
        const proxyCheckBtn = document.getElementById('proxyCheckBtn');
        if (proxyCheckBtn) {
            proxyCheckBtn.addEventListener('click', () => {
                this.performProxyCheck();
            });
        }

        // Blacklist Check (только если элемент существует)
        const blacklistBtn = document.getElementById('blacklistBtn');
        if (blacklistBtn) {
            blacklistBtn.addEventListener('click', () => {
                this.performBlacklistCheck();
            });
        }

        // Speed Test (только если элемент существует)
        const speedTestBtn = document.getElementById('speedTestBtn');
        if (speedTestBtn) {
            speedTestBtn.addEventListener('click', () => {
                this.performSpeedTest();
            });
        }

        // Speed Test Reset (только если элемент существует)
        const speedTestResetBtn = document.getElementById('speedTestResetBtn');
        if (speedTestResetBtn) {
            speedTestResetBtn.addEventListener('click', () => {
                this.resetSpeedTest();
            });
        }


        // Language switching
        this.setupLanguageSwitcher();
    }

    setupLanguageSwitcher() {
        const dropdown = document.getElementById('languageDropdown');
        if (!dropdown) return;

        const trigger = dropdown.querySelector('.dropdown-trigger');
        const menu = dropdown.querySelector('.dropdown-menu');
        const items = dropdown.querySelectorAll('.dropdown-item');

        // Toggle dropdown
        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', () => {
            dropdown.classList.remove('active');
        });

        // Handle language selection
        items.forEach(item => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const lang = item.dataset.lang;
                this.switchLanguage(lang);
                dropdown.classList.remove('active');
            });
        });
    }

    switchLanguage(lang) {
        const currentPath = window.location.pathname;
        let newPath;

        if (lang === 'en') {
            // Switch to English (root)
            if (currentPath.startsWith('/ru/') || currentPath.startsWith('/es/')) {
                newPath = currentPath.replace(/^\/(ru|es)\//, '/');
            } else {
                newPath = currentPath;
            }
        } else {
            // Switch to Russian or Spanish
            if (currentPath.startsWith('/ru/') || currentPath.startsWith('/es/')) {
                // Already in a language folder, just change the language
                newPath = currentPath.replace(/^\/(ru|es)\//, `/${lang}/`);
            } else {
                // In root, add language prefix
                newPath = `/${lang}${currentPath}`;
            }
        }

        // Ensure the path starts with /
        if (!newPath.startsWith('/')) {
            newPath = '/' + newPath;
        }

        // Navigate to new language version
        window.location.href = newPath;
    }

    setActiveNavLink() {
        const currentPath = window.location.pathname;
        const navLinks = document.querySelectorAll('.nav-link');
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const href = link.getAttribute('href');
            
            if (href === 'index.html' && (currentPath === '/' || currentPath.endsWith('/index.html'))) {
                link.classList.add('active');
            } else if (href === 'about.html' && currentPath.endsWith('/about.html')) {
                link.classList.add('active');
            } else if (href === 'privacy.html' && currentPath.endsWith('/privacy.html')) {
                link.classList.add('active');
            } else if (href === 'terms.html' && currentPath.endsWith('/terms.html')) {
                link.classList.add('active');
            }
        });
    }

    copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        const text = element.textContent;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showCopySuccess(elementId);
            });
        } else {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showCopySuccess(elementId);
        }
    }

    showCopySuccess(elementId) {
        const button = document.getElementById(`copy${elementId.charAt(0).toUpperCase() + elementId.slice(1)}`);
        const originalIcon = button.innerHTML;
        button.innerHTML = '<i class="fas fa-check"></i>';
        button.style.background = '#4CAF50';
        
        setTimeout(() => {
            button.innerHTML = originalIcon;
            button.style.background = '';
        }, 2000);
    }

    async performIPLookup() {
        const input = document.getElementById('ipLookupInput');
        const result = document.getElementById('ipLookupResult');
        const ip = input.value.trim();

        if (!ip) {
            result.innerHTML = '<div class="error">Enter IP address</div>';
            return;
        }

        if (!this.isValidIP(ip)) {
            result.innerHTML = '<div class="error">Invalid IP address format</div>';
            return;
        }

        result.innerHTML = '<div class="loading">Searching...</div>';

        try {
            // Используем ipinfo.io вместо ipapi.co
            const response = await fetch(`https://ipinfo.io/${ip}/json`);
            const data = await response.json();

            if (data.error) {
                result.innerHTML = `<div class="error">Error: ${data.error.title || 'Unknown error'}</div>`;
                return;
            }

            result.innerHTML = `
                <div class="success">
                    <h4>IP Information: ${data.ip}</h4>
                    <p><strong>Country:</strong> ${data.country || 'Unknown'}</p>
                    <p><strong>City:</strong> ${data.city || 'Unknown'}</p>
                    <p><strong>Provider:</strong> ${data.org || 'Unknown'}</p>
                    <p><strong>Timezone:</strong> ${data.timezone || 'Unknown'}</p>
                </div>
            `;
        } catch (error) {
            result.innerHTML = '<div class="error">Error searching IP</div>';
        }
    }

    async performDNSLookup() {
        const input = document.getElementById('dnsLookupInput');
        const result = document.getElementById('dnsLookupResult');
        const domain = input.value.trim();

        if (!domain) {
            result.innerHTML = '<div class="error">Enter domain</div>';
            return;
        }

        result.innerHTML = '<div class="loading">Checking DNS...</div>';

        try {
            // Простая проверка DNS через fetch
            const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
            const data = await response.json();

            if (data.Answer && data.Answer.length > 0) {
                const ips = data.Answer.map(record => record.data).join(', ');
                result.innerHTML = `
                    <div class="success">
                        <h4>DNS records for ${domain}:</h4>
                        <p><strong>A records:</strong> ${ips}</p>
                    </div>
                `;
            } else {
                result.innerHTML = '<div class="error">DNS records not found</div>';
            }
        } catch (error) {
            result.innerHTML = '<div class="error">Error checking DNS</div>';
        }
    }

    async performProxyCheck() {
        const result = document.getElementById('proxyCheckResult');
        result.innerHTML = '<div class="loading">Checking proxy...</div>';

        try {
            const response = await fetch('https://ipinfo.io/json');
            const data = await response.json();

            // Простая проверка на прокси
            const isProxy = data.org && (
                data.org.toLowerCase().includes('proxy') ||
                data.org.toLowerCase().includes('vpn') ||
                data.org.toLowerCase().includes('hosting')
            );

            result.innerHTML = `
                <div class="${isProxy ? 'warning' : 'success'}">
                    <h4>Proxy check result:</h4>
                    <p><strong>Status:</strong> ${isProxy ? 'Possible proxy/VPN usage' : 'Direct connection'}</p>
                    <p><strong>Provider:</strong> ${data.org || 'Unknown'}</p>
                </div>
            `;
        } catch (error) {
            result.innerHTML = '<div class="error">Error checking proxy</div>';
        }
    }

    async performBlacklistCheck() {
        const input = document.getElementById('blacklistInput');
        const result = document.getElementById('blacklistResult');
        const ip = input.value.trim();

        if (!ip) {
            result.innerHTML = '<div class="error">Enter IP address</div>';
            return;
        }

        if (!this.isValidIP(ip)) {
            result.innerHTML = '<div class="error">Invalid IP address format</div>';
            return;
        }

        result.innerHTML = '<div class="loading">Checking blacklists...</div>';

        try {
            // Простая проверка через API
            const response = await fetch(`https://ipinfo.io/${ip}/json`);
            const data = await response.json();

            if (data.error) {
                result.innerHTML = `<div class="error">Error: ${data.reason}</div>`;
                return;
            }

            // Базовая проверка на подозрительную активность
            const isSuspicious = data.org && (
                data.org.toLowerCase().includes('hosting') ||
                data.org.toLowerCase().includes('datacenter')
            );

            result.innerHTML = `
                <div class="${isSuspicious ? 'warning' : 'success'}">
                    <h4>Blacklist check result for ${ip}:</h4>
                    <p><strong>Status:</strong> ${isSuspicious ? 'Suspicious activity' : 'Clean IP'}</p>
                    <p><strong>Provider:</strong> ${data.org || 'Unknown'}</p>
                </div>
            `;
        } catch (error) {
            result.innerHTML = '<div class="error">Error checking blacklists</div>';
        }
    }

    async performSpeedTest() {
        const result = document.getElementById('speedTestResult');
        const button = document.getElementById('speedTestBtn');
        const resetButton = document.getElementById('speedTestResetBtn');
        
        if (!result || !button) return;

        // Блокируем кнопки и меняем иконку Start
        button.disabled = true;
        button.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Start Test';
        
        // Disable кнопку Reset
        if (resetButton) {
            resetButton.disabled = true;
        }
        
        // Спидометр только для скорости скачивания
        this.updateSpeedometer(0, 'Initializing...');
        
        // Показываем иконки загрузки
        this.updateLeftResultsWithLoading();
        
        // Сбрасываем массив вызовов для нового теста
        this.speedometerCalls = [];

        try {
            // Инициализация (1 сек)
            await this.delay(1000);
            
            // Запускаем пинг и скачивание параллельно
            this.updateSpeedometer(0, 'Testing download speed...');
            this.updateProgress(0, 'Testing download speed...');
            
            // Параллельно запускаем пинг и тест скорости
            const [ping, speed] = await Promise.all([
                this.testPingWithAnimation(),
                this.testDownloadSpeedWithAnimation()
            ]);
            
            // Показываем результаты
            setTimeout(() => {
                this.displaySpeedResults(ping, speed);
            }, 500);
            
        } catch (error) {
            console.error('Speed test error:', error);
            this.updateSpeedometer(0, 'Test Failed');
            this.updateLeftResults('Error', 'Error', 'Error');
        } finally {
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-play"></i> Start Test';
            
            // Enable кнопку Reset
            if (resetButton) {
                resetButton.disabled = false;
            }
        }
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    updateSpeedometer(speed, labelId) {        
        const needle = document.getElementById('speedometerNeedle');
        const arrow = needle ? needle.querySelector('.speedometer-arrow') : null;
        if (!arrow) return;
    
        // приведение и защита
        speed = Number(speed);
        if (!isFinite(speed)) speed = 0;
        if (speed < 0) speed = 0;
    
        // сегменты: [min, max] -> [startDeg, endDeg]
        const segments = [
            {min: 0,   max: 5,    start: 0,   end: 35},
            {min: 5,   max: 10,   start: 35,  end: 68},
            {min: 10,  max: 50,   start: 68,  end: 103},
            {min: 50,  max: 100,  start: 103, end: 148},
            {min: 100, max: 250,  start: 148, end: 185},
            {min: 250, max: 500,  start: 185, end: 220},
            {min: 500, max: 1000, start: 220, end: 260},
        ];
    
        let rotation = 0;
        for (const s of segments) {
            if (speed >= s.min && speed <= s.max) {
                const frac = (s.max === s.min) ? 0 : (speed - s.min) / (s.max - s.min);
                rotation = s.start + frac * (s.end - s.start);
                break;
            }
        }
        // выше 1000 — просто максимум
        if (speed > 1000) rotation = 260;
    
        // применяем (transformOrigin оставлен в покое — не трогал)
        
        console.log(rotation, 'rotation');
        
        arrow.style.transform = `rotate(${rotation}deg)`;
    
        // обновляем отображение текущей скорости
        const currentSpeedValue = document.getElementById('currentSpeedValue');
        if (currentSpeedValue) {
            currentSpeedValue.textContent = speed.toFixed(1);
        }
    
        // обновляем метку, если есть id
        if (labelId) {
            const label = document.getElementById(labelId);
            if (label) {
                const t = this.getTranslations();
                label.textContent = `${speed} ${t.mbps}`;
            }
        }
    }

    updateLeftResults(ping, download, overall) {
        const pingValue = document.getElementById('pingValue');
        const downloadValue = document.getElementById('downloadValue');
        const overallValue = document.getElementById('overallValue');
        
        if (pingValue) pingValue.textContent = ping;
        if (downloadValue) downloadValue.textContent = download;
        if (overallValue) overallValue.textContent = overall;
    }

    updateLeftResultsWithLoading() {
        const pingValue = document.getElementById('pingValue');
        const downloadValue = document.getElementById('downloadValue');
        const overallValue = document.getElementById('overallValue');
        
        if (pingValue) pingValue.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (downloadValue) downloadValue.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        if (overallValue) overallValue.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    }

    resetSpeedTest() {
        // Сбрасываем результаты
        this.updateLeftResults('--', '--', '--');
        
        // Сбрасываем отображение текущей скорости
        const currentSpeedValue = document.getElementById('currentSpeedValue');
        if (currentSpeedValue) {
            currentSpeedValue.textContent = '0';
        }
        
        // Возвращаем стрелку в начальную позицию
        this.updateSpeedometer(0, 'Click GO to start');
        
        // Сбрасываем массив вызовов
        this.speedometerCalls = [];
        
        // Сбрасываем статусы блоков
        const pingResult = document.getElementById('pingResult');
        const downloadResult = document.getElementById('downloadResult');
        const overallResult = document.getElementById('overallResult');
        
        [pingResult, downloadResult, overallResult].forEach(el => {
            if (el) {
                el.className = 'speed-test-item-bottom';
            }
        });
    }

    updateLeftResultsWithStatus(ping, download, overall) {
        this.updateLeftResults(ping, download, overall);
        
        // Обновляем статусы блоков
        const pingResult = document.getElementById('pingResult');
        const downloadResult = document.getElementById('downloadResult');
        const overallResult = document.getElementById('overallResult');
        
        // Сбрасываем все статусы
        [pingResult, downloadResult, overallResult].forEach(el => {
            if (el) {
                el.className = 'speed-test-item-bottom';
            }
        });
        
        // Устанавливаем статусы на основе значений
        if (pingResult && ping !== '--') {
            const pingNum = parseInt(ping);
            if (pingNum < 20) pingResult.classList.add('excellent');
            else if (pingNum < 50) pingResult.classList.add('good');
            else if (pingNum < 100) pingResult.classList.add('fair');
            else pingResult.classList.add('poor');
        }
        
        if (downloadResult && download !== '--') {
            const downloadNum = parseFloat(download);
            if (downloadNum > 50) downloadResult.classList.add('excellent');
            else if (downloadNum > 25) downloadResult.classList.add('good');
            else if (downloadNum > 10) downloadResult.classList.add('fair');
            else downloadResult.classList.add('poor');
        }
        
        if (overallResult && overall !== '--') {
            if (overall === 'Excellent') overallResult.classList.add('excellent');
            else if (overall === 'Good') overallResult.classList.add('good');
            else if (overall === 'Fair') overallResult.classList.add('fair');
            else overallResult.classList.add('poor');
        }
    }

    async testPing() {
        const startTime = performance.now();
        await fetch('https://api.ipify.org?format=json');
        const endTime = performance.now();
        return Math.round(endTime - startTime);
    }

    async testPingWithAnimation() {
        try {            
            // Используем несколько API для более точного ping
            const apis = [
                'https://api.ipify.org?format=json',
                'https://ipinfo.io/json',
                'https://api64.ipify.org?format=json'
            ];
            
            let bestPing = 999;
            
            for (let i = 0; i < apis.length; i++) {
                try {
                    const startTime = performance.now();
                    
                    await fetch(apis[i], { 
                        method: 'GET',
                        cache: 'no-cache'
                    });
                    
                    const endTime = performance.now();
                    const ping = Math.round(endTime - startTime);
                    
                    // Обновляем результат пинга динамически при каждом измерении
                    this.updateLeftResults(`${ping}ms`, '--', '--');
                    
                    if (ping < bestPing) {
                        bestPing = ping;
                    }
                    
                    // Если ping хороший, не пробуем остальные
                    if (ping < 100) {
                        break;
                    }
                } catch (error) {
                    continue;
                }
            }
            
            return bestPing;
        } catch (error) {
            console.error('❌ PING TEST FAILED:', error);
            return 50; // Возвращаем разумное значение при ошибке
        }
    }

    async testDownloadSpeed() {
        // Используем CDN файл для теста скорости
        const testFileUrl = 'https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js';
        const fileSize = 71 * 1024; // 71KB в байтах
        
        const startTime = performance.now();
        const response = await fetch(testFileUrl);
        await response.text();
        const endTime = performance.now();
        
        const timeInSeconds = (endTime - startTime) / 1000;
        const speedInBps = fileSize / timeInSeconds;
        const speedInMbps = (speedInBps * 8) / (1024 * 1024); // Конвертируем в Мбит/с
        
        return Math.round(speedInMbps * 10) / 10; // Округляем до 1 знака
    }

    async testDownloadSpeedWithAnimation() {
        // Анимируем спидометр во время speed теста
        for (let i = 40; i <= 75; i += 5) {
            this.updateSpeedometer(i, `Testing speed... ${i}%`);
            await this.delay(200);
        }
        
        try {
            // Используем ваш AWS S3 файл для точного теста скорости
            const testFileUrl = 'https://ipdetect-file.s3.eu-north-1.amazonaws.com/60MB'; // 60MB файл
            const fileSize = 60 * 1024 * 1024; // 60MB в байтах           
            const startTime = performance.now();
            
            // Добавляем случайный параметр для предотвращения кэширования
            const randomParam = Math.random().toString(36).substring(7);
            const urlWithCacheBuster = `${testFileUrl}?v=${randomParam}&t=${Date.now()}`;     
            console.log(111111111111111111);
                   
            const response = await fetch(urlWithCacheBuster, {
                method: 'GET',
                cache: 'no-cache',
                headers: {
                    'Cache-Control': 'no-cache, no-store, must-revalidate',
                    'Pragma': 'no-cache',
                    'Expires': '0'
                }
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            
            // Получаем размер файла из заголовка
            const contentLength = response.headers.get('content-length');
            const totalSize = contentLength ? parseInt(contentLength) : fileSize;
            
            console.log(`📊 Total file size: ${totalSize} bytes (${(totalSize / 1024 / 1024).toFixed(2)} MB)`);
            
            // Создаем ReadableStream для отслеживания прогресса
            const reader = response.body.getReader();
            const chunks = [];
            let downloadedBytes = 0;
            
            // Запускаем мониторинг прогресса
            const progressInterval = setInterval(() => {
                const currentTime = performance.now();
                const elapsedTime = (currentTime - startTime) / 1000; // в секундах
                const progress = (downloadedBytes / totalSize) * 100;
                const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
                const totalMB = (totalSize / 1024 / 1024).toFixed(2);
                
                // Рассчитываем текущую скорость
                const currentSpeedBps = downloadedBytes / elapsedTime; // байт/сек
                const currentSpeedMbps = (currentSpeedBps * 8) / (1024 * 1024); // Мбит/сек
                
                console.log(`📥 Downloaded: ${downloadedMB}MB / ${totalMB}MB (${progress.toFixed(1)}%) - Speed: ${currentSpeedMbps.toFixed(2)} Mbps`);
                
                // Передаем реальную скорость в updateProgress
                this.updateProgress(currentSpeedMbps, `Downloading... ${progress.toFixed(1)}%`);
            }, 1000); // Каждую секунду
            
            // Читаем данные по частям
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                
                chunks.push(value);
                downloadedBytes += value.length;
            }
            
            // Останавливаем мониторинг
            clearInterval(progressInterval);
            
            // Собираем все данные
            const data = new Uint8Array(downloadedBytes);
            let position = 0;
            for (const chunk of chunks) {
                data.set(chunk, position);
                position += chunk.length;
            }
            const endTime = performance.now();
            
            const timeInSeconds = (endTime - startTime) / 1000;
            const actualFileSize = data.byteLength;
            
            // Проверяем, что файл скачался полностью
            if (actualFileSize !== fileSize) {
                console.warn(`⚠️ File size mismatch: expected ${fileSize}, got ${actualFileSize}`);
            }
            
            // Правильный расчет скорости в Мбит/с
            const speedInBps = actualFileSize / timeInSeconds;
            const speedInMbps = (speedInBps * 8) / (1024 * 1024);
            const realisticSpeed = speedInMbps;
            
            return Math.round(realisticSpeed * 10) / 10; // Округляем до 1 знака
        } catch (error) {
            return 1.0; // Возвращаем разумное значение при ошибке
        }
    }

    updateProgress(speed, message) {
        // В новом дизайне нет progress bar, просто обновляем лейбл спидометра
        
        // Инициализируем массив если его нет (для каждого экземпляра отдельно)
        if (!this.speedometerCalls) {
            this.speedometerCalls = [];
        }
        
        // Добавляем текущий вызов в массив только если это скорость (не ping)
        if (typeof speed === 'number' && speed > 0) {
            this.speedometerCalls.push(speed);
            
            // Рассчитываем среднее значение от первого до текущего
            const averageSpeed = this.speedometerCalls.reduce((sum, val) => sum + val, 0) / this.speedometerCalls.length;
            
            console.log(speed, 'current speed');
            console.log(`📊 Average speed: ${averageSpeed.toFixed(2)} Mbps (from ${this.speedometerCalls.length} calls)`);
            
            this.updateSpeedometer(averageSpeed, message);
        } else {
            // Для ping просто передаем значение как есть
            this.updateSpeedometer(speed, message);
        }
    }

    getLanguage() {
        const path = window.location.pathname;
        if (path.includes('/ru/')) return 'ru';
        if (path.includes('/es/')) return 'es';
        return 'en';
    }

    getTranslations() {
        const lang = this.getLanguage();
        const translations = {
            en: {
                excellent: 'Excellent',
                good: 'Good',
                fair: 'Fair',
                poor: 'Poor',
                speed: 'Speed',
                mbps: 'Mbps'
            },
            ru: {
                excellent: 'Отлично',
                good: 'Хорошо',
                fair: 'Удовлетворительно',
                poor: 'Плохо',
                speed: 'Скорость',
                mbps: 'Мбит/с'
            },
            es: {
                excellent: 'Excelente',
                good: 'Bueno',
                fair: 'Regular',
                poor: 'Malo',
                speed: 'Velocidad',
                mbps: 'Mbps'
            }
        };
        return translations[lang] || translations.en;
    }

    displaySpeedResults(ping, speed) {
        const t = this.getTranslations();
        let overallStatus = t.poor;
        
        if (ping < 20 && speed > 50) {
            overallStatus = t.excellent;
        } else if (ping < 50 && speed > 25) {
            overallStatus = t.good;
        } else if (ping < 100 && speed > 10) {
            overallStatus = t.fair;
        }

        // Обновляем блоки с результатами
        this.updateLeftResultsWithStatus(ping, speed, overallStatus);
        
        
        this.updateSpeedometer(speed, `${t.speed}: ${speed} ${t.mbps}`);
    }

    isValidIP(ip) {
        return this.isIPv4(ip) || this.isIPv6(ip);
    }

    isIPv4(ip) {
        const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
        return ipv4Regex.test(ip);
    }

    isIPv6(ip) {
        // Более полная проверка IPv6 адресов
        const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^::$|^(?:[0-9a-fA-F]{1,4}:)*::(?:[0-9a-fA-F]{1,4}:)*[0-9a-fA-F]{1,4}$|^(?:[0-9a-fA-F]{1,4}:){1,7}:$|^:(?:[0-9a-fA-F]{1,4}:){1,6}[0-9a-fA-F]{1,4}$/;
        return ipv6Regex.test(ip);
    }

    async getIPv6FromWebRTC() {
        return new Promise((resolve) => {
            const pc = new RTCPeerConnection({
                iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
            });

            pc.createDataChannel('');
            pc.createOffer().then(offer => pc.setLocalDescription(offer));

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    const candidate = event.candidate.candidate;
                    const ipMatch = candidate.match(/([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}/);
                    if (ipMatch) {
                        pc.close();
                        resolve(ipMatch[0]);
                    }
                }
            };

            setTimeout(() => {
                pc.close();
                resolve(null);
            }, 3000);
        });
    }
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    new IPChecker();
});