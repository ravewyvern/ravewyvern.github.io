console.log("Secret page JS loaded!");
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('stay_key_hex');
    // return to login page
    window.location.href = '../index.html'; // or the login file path
});