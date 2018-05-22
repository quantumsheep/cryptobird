const socket = io();
ModalBird.init();

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

    http.send(`_csrf=${document.getElementById('_csrf').value}&user=${id}`);
}

socket.on('contact search', (contacts, type) => {
    if (contacts) {
        if (type === 'contact') {
            document.getElementById("search-contacts").innerHTML = "";

            contacts.forEach(contact => {
                document.getElementById("search-contacts").innerHTML += `<a href="/messenger/${contact.id}" class="list-group-item list-group-item-action p-2 active"><small>${contact.username}</small></a>`;
            });
        } else if (type === 'others') {
            document.getElementById("search-others").innerHTML = "";

            contacts.forEach(contact => {
                document.getElementById("search-others").innerHTML += `<li class="list-group-item d-flex justify-content-between align-items-center p-2 active"><small>${contact.username}</small><small class="fas fa-plus cursor-pointer" onclick="addContact(this, ${contact.id});"></small></li>`;
            });
        } else if (type === 'asked') {
            document.getElementById("search-asked").innerHTML = "";

            contacts.forEach(contact => {
                document.getElementById("search-asked").innerHTML += `<li class="list-group-item p-2 active"><small>${contact.username}</small></li>`;
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

        document.getElementById("messages-list").classList.add("d-none");
        document.getElementById("search-response").classList.remove("d-none");
    } else {
        document.getElementById("search-response").classList.add("d-none");
        document.getElementById("messages-list").classList.remove("d-none");
    }
});

document.getElementById("btn-messages").addEventListener('click', e => {
    if (!e.target.classList.contains('active')) {
        document.getElementById("btn-contacts").classList.remove("active");
        document.getElementById("btn-me").classList.remove("active");
        document.getElementById("btn-messages").classList.add("active");
        document.getElementById("btn-groups").classList.remove("active");

        document.getElementById("search-response").classList.add("d-none");
        document.getElementById("my-infos").classList.add("d-none");
        document.getElementById("contacts-list").classList.add("d-none");
        document.getElementById("search-box").classList.remove("d-none");
        document.getElementById("messages-list").classList.remove("d-none");
        document.getElementById("groups-list").classList.add("d-none");
    }
});

document.getElementById("btn-contacts").addEventListener('click', e => {
    if (!e.target.classList.contains('active')) {
        e.target.classList.add('active');

        const http = new XMLHttpRequest();
        http.open("GET", "/get/contacts", true);

        http.onreadystatechange = (req, ev) => {
            if (http.readyState == 4 && http.status == 200 && http.responseText) {
                const contacts = JSON.parse(http.responseText);

                if (Array.isArray(contacts)) {
                    const contacts_list = document.getElementById("contacts-list");
                    contacts_list.innerHTML = "";

                    contacts.forEach(contact => {
                        contacts_list.innerHTML += `<a href="/messenger/${contact.id}" class="list-group-item list-group-item-action p-2 active"><small>${contact.username}</small></a>`;
                    });

                    document.getElementById("btn-messages").classList.remove("active");
                    document.getElementById("btn-me").classList.remove("active");
                    document.getElementById("btn-contacts").classList.add("active");
                    document.getElementById("btn-groups").classList.remove("active");

                    document.getElementById("messages-list").classList.add("d-none");
                    document.getElementById("search-response").classList.add("d-none");
                    document.getElementById("my-infos").classList.add("d-none");
                    document.getElementById("search-box").classList.remove("d-none");
                    document.getElementById("contacts-list").classList.remove("d-none");
                    document.getElementById("groups-list").classList.add("d-none");
                }
            }
        }

        http.send();
    }
});

document.getElementById("btn-groups").addEventListener('click', e => {
    if (!e.target.classList.contains('active')) {
        document.getElementById("btn-messages").classList.remove("active");
        document.getElementById("btn-contacts").classList.remove("active");
        document.getElementById("btn-groups").classList.add("active");
        document.getElementById("btn-me").classList.remove("active");

        document.getElementById("search-box").classList.add("d-none");
        document.getElementById("search-response").classList.add("d-none");
        document.getElementById("contacts-list").classList.add("d-none");
        document.getElementById("messages-list").classList.add("d-none");
        document.getElementById("my-infos").classList.add("d-none");
        document.getElementById("groups-list").classList.remove("d-none");
    }
});

document.getElementById("btn-me").addEventListener('click', e => {
    if (!e.target.classList.contains('active')) {
        document.getElementById("btn-contacts").classList.remove("active");
        document.getElementById("btn-messages").classList.remove("active");
        document.getElementById("btn-groups").classList.remove("active");
        document.getElementById("btn-me").classList.add("active");

        document.getElementById("search-box").classList.add("d-none");
        document.getElementById("search-response").classList.add("d-none");
        document.getElementById("contacts-list").classList.add("d-none");
        document.getElementById("messages-list").classList.add("d-none");
        document.getElementById("my-infos").classList.remove("d-none");
        document.getElementById("groups-list").classList.add("d-none");
    }
});

document.getElementById('group-2-previous').addEventListener('click', e => {
    document.getElementById('group-1').name.focus();
    ModalBird.hide('group-2');
    ModalBird.show('group-1');
});

document.getElementById('new-group-btn').addEventListener('click', e => {
    document.getElementById('group-1').name.value = "";
    document.getElementById('group-1').name.focus();
    ModalBird.show('group-1');
});

document.getElementById("group-1").addEventListener('submit', e => {
    e.preventDefault();

    if (e.target.name.value && e.target.name.value.length > 0) {
        ModalBird.hide('group-1');
        ModalBird.show('group-2');
    }
});

socket.emit('get messages', 0);