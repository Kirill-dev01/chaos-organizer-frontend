export default class UI {
    constructor(container, apiObj) {
        this.container = container;
        this.api = apiObj;

        this.messagesList = container.querySelector('.messages-list');
        this.form = container.querySelector('.chat-form');
        this.input = container.querySelector('.chat-input');

        this.geoBtn = container.querySelector('.chat-geo');
        this.attachBtn = container.querySelector('.chat-attach');
        this.fileInput = container.querySelector('.file-input');
        this.dndOverlay = container.querySelector('.dnd-overlay');

        // Переменные для ленивой загрузки
        this.loadedMessagesCount = 0;
        this.isLoading = false;

        this.initEvents();
        this.loadHistory(); // При старте сразу грузим первые 10 сообщений
    }

    initEvents() {
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            const text = this.input.value.trim();
            if (text) {
                this.api.sendMessage(text, 'text');
                this.input.value = '';
            }
        });

        this.geoBtn.addEventListener('click', () => {
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition((pos) => {
                    const { latitude, longitude } = pos.coords;
                    this.api.sendMessage(`Моя геопозиция: https://yandex.ru/maps/?pt=${longitude},${latitude}&z=15`, 'text');
                });
            }
        });

        this.attachBtn.addEventListener('click', () => this.fileInput.click());

        this.fileInput.addEventListener('change', () => {
            Array.from(this.fileInput.files).forEach(f => this.api.uploadFile(f));
            this.fileInput.value = '';
        });

        this.container.addEventListener('dragover', (e) => {
            e.preventDefault(); this.dndOverlay.classList.remove('hidden');
        });
        this.container.addEventListener('dragleave', (e) => {
            e.preventDefault();
            if (!e.relatedTarget || !this.container.contains(e.relatedTarget)) this.dndOverlay.classList.add('hidden');
        });
        this.container.addEventListener('drop', (e) => {
            e.preventDefault(); this.dndOverlay.classList.add('hidden');
            Array.from(e.dataTransfer.files).forEach(f => this.api.uploadFile(f));
        });

        // СОБЫТИЕ: Отслеживаем скролл для ленивой подгрузки
        this.messagesList.addEventListener('scroll', () => {
            // Если прокрутили в самый верх (scrollTop === 0) и сейчас не идет загрузка
            if (this.messagesList.scrollTop === 0 && !this.isLoading) {
                this.loadHistory();
            }
        });
    }

    // МЕТОД: Загрузка истории
    async loadHistory() {
        this.isLoading = true;
        const oldScrollHeight = this.messagesList.scrollHeight;

        // Просим API дать нам старые сообщения, смещаясь на кол-во уже загруженных
        const olderMessages = await this.api.fetchHistory(this.loadedMessagesCount);

        if (olderMessages.length > 0) {
            // Сообщения приходят от старых к новым в этой пачке, 
            // но нам нужно вставить их В НАЧАЛО списка
            olderMessages.reverse().forEach(msg => {
                this.renderMessage(msg, true); // true = вставляем наверх (prepend)
                this.loadedMessagesCount++;
            });

            // Восстанавливаем позицию скролла, чтобы чат не "прыгал" вверх
            const newScrollHeight = this.messagesList.scrollHeight;
            this.messagesList.scrollTop = newScrollHeight - oldScrollHeight;
        }

        this.isLoading = false;
    }

    formatMessage(text) {
        if (!text) return '';
        let formatted = text.replace(/(https?:\/\/[^\s]+)/g, '<a href="$1" target="_blank">$1</a>');
        formatted = formatted.replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>');
        return formatted;
    }

    renderMedia(msg) {
        if (msg.content.startsWith('image/')) return `<img src="${msg.fileUrl}" style="max-width: 100%; border-radius: 8px;">`;
        if (msg.content.startsWith('video/')) return `<video src="${msg.fileUrl}" controls style="max-width: 100%; border-radius: 8px;"></video>`;
        if (msg.content.startsWith('audio/')) return `<audio src="${msg.fileUrl}" controls style="max-width: 100%;"></audio>`;
        return `<a href="${msg.fileUrl}" download="${msg.fileName}" target="_blank">📄 ${msg.fileName}</a>`;
    }

    // Измененный метод рендера: может добавлять как вниз (append), так и вверх (prepend)
    renderMessage(msg, prepend = false) {
        const div = document.createElement('div');
        const isBot = msg.type === 'text' && msg.content.includes('🤖');
        div.className = `message ${isBot ? '' : 'user'}`;
        const date = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        const contentHtml = msg.type === 'file' ? this.renderMedia(msg) : this.formatMessage(msg.content);

        div.innerHTML = `<div class="message-content">${contentHtml}</div><div class="message-time">${date}</div>`;

        if (prepend) {
            this.messagesList.prepend(div); // Вставляем наверх истории
        } else {
            this.messagesList.appendChild(div); // Вставляем вниз (новое сообщение)
            this.messagesList.scrollTop = this.messagesList.scrollHeight; // Скроллим вниз

            // Если это новое сообщение, увеличиваем счетчик, чтобы пагинация не сбилась
            this.loadedMessagesCount++;
        }
    }
}