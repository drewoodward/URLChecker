document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('test-btn');
    const status = document.getElementById('status');

    btn.addEventListener('click', () => {
        console.log("Hello from the console!");
        status.innerText = "Hello World! The JS is connected.";
    });
});