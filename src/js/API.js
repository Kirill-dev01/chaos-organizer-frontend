export default class API {
    constructor(url, onMessageReceived) {
        this.wsUrl = url;
        this.httpUrl = url.replace('ws://', 'http://').replace('wss://', 'https://');
        this.ws = new WebSocket(url);

        this.ws.addEventListener('open', () => console.log('Подключено к WS!'));

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
            const response = await fetch(`${this.httpUrl}/upload`, { method: 'POST', body: formData });
            if (response.ok) {
                const result = await response.json();
                if (this.ws.readyState === WebSocket.OPEN) {
                    this.ws.send(JSON.stringify({
                        type: 'file', content: result.mimeType, fileUrl: result.url, fileName: result.name
                    }));
                }
            }
        } catch (e) { console.error('Ошибка загрузки:', e); }
    }

    // МЕТОД: Запрос истории
    async fetchHistory(loadedCount) {
        try {
            // Отправляем GET запрос с параметром start
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