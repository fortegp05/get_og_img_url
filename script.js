document.addEventListener('DOMContentLoaded', function() {
    const urlInput = document.getElementById('urlInput');
    const extractButton = document.getElementById('extractButton');
    const loading = document.getElementById('loading');
    const result = document.getElementById('result');
    const error = document.getElementById('error');
    const ogImage = document.getElementById('ogImage');
    const ogImageUrl = document.getElementById('ogImageUrl');
    const copyButton = document.getElementById('copyButton');
    const errorMessage = document.getElementById('errorMessage');

    extractButton.addEventListener('click', extractOGImage);
    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            extractOGImage();
        }
    });
    copyButton.addEventListener('click', copyToClipboard);

    async function extractOGImage() {
        const url = urlInput.value.trim();
        
        if (!url) {
            showError('URLを入力してください');
            return;
        }

        if (!isValidUrl(url)) {
            showError('有効なURLを入力してください');
            return;
        }

        hideMessages();
        showLoading();

        try {
            const ogImageUrlResult = await fetchOGImage(url);
            
            if (ogImageUrlResult) {
                showResult(ogImageUrlResult);
            } else {
                showError('OG画像が見つかりませんでした');
            }
        } catch (err) {
            showError('エラーが発生しました: ' + err.message);
        }
    }

    async function fetchOGImage(url) {
        const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
        
        const response = await fetch(proxyUrl);
        if (!response.ok) {
            throw new Error('ページの取得に失敗しました');
        }
        
        const data = await response.json();
        const html = data.contents;
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        const ogImageMeta = doc.querySelector('meta[property="og:image"]');
        
        if (ogImageMeta) {
            let ogImageUrl = ogImageMeta.getAttribute('content');
            
            if (ogImageUrl.startsWith('//')) {
                ogImageUrl = 'https:' + ogImageUrl;
            } else if (ogImageUrl.startsWith('/')) {
                const urlObj = new URL(url);
                ogImageUrl = urlObj.origin + ogImageUrl;
            } else if (!ogImageUrl.startsWith('http')) {
                const urlObj = new URL(url);
                ogImageUrl = new URL(ogImageUrl, urlObj.origin).href;
            }
            
            return ogImageUrl;
        }
        
        return null;
    }

    function showResult(imageUrl) {
        ogImage.src = imageUrl;
        ogImageUrl.textContent = imageUrl;
        
        ogImage.onload = function() {
            hideLoading();
            result.classList.remove('hidden');
        };
        
        ogImage.onerror = function() {
            hideLoading();
            showError('画像の読み込みに失敗しました: ' + imageUrl);
        };
    }

    function showLoading() {
        loading.classList.remove('hidden');
    }

    function hideLoading() {
        loading.classList.add('hidden');
    }

    function showError(message) {
        hideLoading();
        errorMessage.textContent = message;
        error.classList.remove('hidden');
    }

    function hideMessages() {
        result.classList.add('hidden');
        error.classList.add('hidden');
        loading.classList.add('hidden');
    }

    function isValidUrl(string) {
        try {
            new URL(string);
            return true;
        } catch (_) {
            return false;
        }
    }

    async function copyToClipboard() {
        try {
            await navigator.clipboard.writeText(ogImageUrl.textContent);
            copyButton.textContent = 'コピーしました！';
            setTimeout(() => {
                copyButton.textContent = 'URLをコピー';
            }, 2000);
        } catch (err) {
            console.error('クリップボードへのコピーに失敗しました:', err);
            copyButton.textContent = 'コピー失敗';
            setTimeout(() => {
                copyButton.textContent = 'URLをコピー';
            }, 2000);
        }
    }
});