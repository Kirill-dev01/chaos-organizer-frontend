import '../css/style.css';
import UI from './UI';
import API from './API';

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.chaos-organizer');

    const api = new API('wss://chaos-organizer-backend-h277.onrender.com', (msg) => {
        ui.renderMessage(msg);
    });

    const ui = new UI(container, api);
});