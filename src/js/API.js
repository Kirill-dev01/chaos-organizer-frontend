export default class API {
    constructor(url, onMessageReceived) {
        this.wsUrl = url;
        // Гениальная строка: автоматически делает из wss:// -> https://
        this.httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');

        this.ws = new WebSocket(this.wsUrl);

        this.ws.addEventListener('open', () => {
            console.log('Подключено к серверу по WebSocket!');
        });

        this.ws.addEventListener('message', (e) => {
            const data = JSON.parse(e.data);
            onMessageReceived(data); // Получаем новое сообщение в реальном времени
        });
    }

    sendMessage(content, type = 'text') {
        if (this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ content, type }));
        }
    }

    async uploadFile(file) {
        const formData = new FormData();
        formData.append('file', file);

        try {
            // Используем this.httpUrl (который стал https://...)
            const response = await fetch(`${this.httpUrl}/upload`, {
                method: 'POST',
                body: formData
            });

            if (response.ok) {
                const result = await response.json();
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'file',
                        content: result.mimeType,
                        fileUrl: result.url,
                        fileName: result.name
                    }));
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки файла:', e);
        }
    }

    // МЕТОД: Запрос истории для ленивой загрузки
    async fetchHistory(loadedCount) {
        try {
            // Используем this.httpUrl (который стал https://...)
            const response = await fetch(`${this.httpUrl}/messages?start=${loadedCount}`);

            if (response.ok) {
                return await response.json(); // Возвращает массив сообщений
            }
            return [];
        } catch (e) {
            console.error('Ошибка получения истории:', e);
            return [];
        }
    }
}