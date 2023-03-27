const currentTime = () => {
    const timeh1 = document.getElementById('five-ditial-time');
    let date = new Date();
    let hh = date.getHours();
    let mm = date.getMinutes();
    let ss = date.getSeconds();

    hh = String(hh).padStart(2, '0');
    mm = String(mm).padStart(2, '0');
    ss = String(ss).padStart(2, '0');

    let time = `${hh}:${mm}:${ss}`;
    timeh1.innerHTML = time;
};

currentTime();
setInterval(currentTime, 1000);