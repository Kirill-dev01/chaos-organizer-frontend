import '../css/style.css';
import UI from './UI';
import API from './API';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.chaos-organizer');

    // Создаем API. Передаем URL сервера и функцию, которая сработает при получении сообщения
    const api = new API('ws://localhost:7070', (msg) => {
        // Когда приходит сообщение, просим UI его отрисовать
        ui.renderMessage(msg);
    });

    // Создаем UI и передаем ему весь объект api, 
    // чтобы UI мог сам вызывать api.sendMessage и api.uploadFile
    const ui = new UI(container, api);
});