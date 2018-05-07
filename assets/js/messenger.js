const socket = io();

socket.emit('user connect', {
    url: window.location.pathname
});

socket.on('chat message', (from, msg) => {
    document.getElementById("messages").innerHTML += `<li>${msg}</li>`;
    document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;
});

socket.on('list messages', msgs => {
    if (msgs) {
        msgs.forEach(msg => {
            const row = document.createElement("li");
            row.appendChild(document.createTextNode(`${msg.username}: ${msg.content}`));

            document.getElementById("messages").insertBefore(row, document.getElementById("messages").firstChild);

            document.getElementById("messages").scrollTop = document.getElementById("messages").scrollHeight - document.getElementById("messages").clientHeight;
        });
    }
});

function addContact(elem, id) {
    const http = new XMLHttpRequest();
    http.open("POST", "/addcontact", true);

    http.setRequestHeader("Content-type", "application/x-www-form-urlencoded");

    http.onreadystatechange = (req, ev) => {
        if (http.readyState == 4 && http.status == 200) {
            if (JSON.parse(http.responseText).response == 1) {
                elem.remove();
            }
        }
    }

    http.send(`user=${id}`);
}

socket.on('contact search', (users, type) => {
    if (users) {
        if (type === 'contact') {
            document.getElementById("search-contacts").innerHTML = "";

            users.forEach(user => {
                document.getElementById("search-contacts").innerHTML += `<a href="/messenger/${user.id}" class="list-group-item list-group-item-action p-2 active"><small>${user.username}</small></a>`;
            });
        } else if (type === 'others') {
            document.getElementById("search-others").innerHTML = "";

            users.forEach(user => {
                document.getElementById("search-others").innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center p-2 active"><small>${user.username}</small><small class="fas fa-plus cursor-pointer" onclick="addContact(this, ${user.id});"></small></li>`;
            });
        } else if (type === 'asked') {
            document.getElementById("search-asked").innerHTML = "";

            users.forEach(user => {
                document.getElementById("search-asked").innerHTML += `<li class="list-group-item p-2 active"><small>${user.username}</small></li>`;
            });
        }
    }
});

document.getElementById("input").addEventListener("submit", e => {
    e.preventDefault();

    socket.emit('chat message', e.target.m.value);

    e.target.m.value = "";
    return false;
});

document.getElementById("search").addEventListener("input", e => {
    if (e.target.value) {
        socket.emit('contact search', e.target.value);

        document.getElementById("contact-list").style.display = "none";
        document.getElementById("search-response").style.display = "";
    } else {
        document.getElementById("search-response").style.display = "none";
        document.getElementById("contact-list").style.display = "";
    }
});

socket.emit('get messages', 0);