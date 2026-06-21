function updateTime() {
    var time = new Date();
    var hh = time.getHours();
    var mm = time.getMinutes();
    var ss = time.getSeconds();

    if (hh >= 12) {
        hh = hh - 12;
        document.getElementById('ampm').innerHTML = 'PM';
    } else {
        document.getElementById('ampm').innerHTML = 'AM';
    }

    if (hh < 10)
        hh = '0' + hh;
    if (mm < 10)
        mm = '0' + mm;
    if (ss < 10)
        ss = '0' + ss;

    document.getElementById('hrs').innerHTML = hh;
    document.getElementById('min').innerHTML = mm;
    document.getElementById('sec').innerHTML = ss;
}

setInterval(updateTime, 1000);