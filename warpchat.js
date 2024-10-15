// import { wt } from './js/global-params.js';
    const wt = new WarpTalk("wss", "warp.cs.au.dk/talk/");

    let current_room;
    let room_list = [];

    // The rooms the user is in now
    let roomUserIsIn = [];
    let checkedInput = "";
    let checkedInputValue = "all";


    let message_list_initial = {
        "General": [],
        "Random": [],
        "Programming": [],
        "Help": [],
        "News": [],
        "Lectures": [],
    };

    let stored_message_list = localStorage.getItem("message_list");
    let message_list = stored_message_list ? JSON.parse(stored_message_list) : message_list_initial;





    console.log("Connecting to the WarpTalk server ...");

    // let nickname = localStorage.getItem('nickName'); // Retrieve the nickname from localStorage
    let nickname;
    wt.connect(connected, nickname);
    if (localStorage.getItem('login') !== null) {
        nickname = localStorage.getItem('login');
    }
    // if dont have nickname, then dont show the client-area
    if (nickname === null || nickname === undefined) {
        document.getElementById('client-area').style.display = 'none';
    }


    let loginForm = document.getElementById('login-Form');
    let nicknameAccount;
    let nicknamePassword;

    let nicknameAccountValue;
    let nicknamePasswordValue;
    // if there's no nickname while the first page loaded, force users back to the regist page
    document.addEventListener('DOMContentLoaded', function () {
        if (nickname === null || nickname === undefined) {
            nicknameAccount = document.getElementById('nickname-Account');
            nicknamePassword = document.getElementById('nickname-Password');
        }
    })


    wt.isLoggedIn(function (isLoggedIn) {
        if (isLoggedIn) { // If we are already logged in we can call connect that we also give a function to call when the connection has been established
            wt.connect(connected);
        }
    });

    // modify
    const nickname_e = document.getElementById("using-nickname");
    nickname_e.addEventListener("click", function (e) {
        let nickname = prompt("What's your (unregistered) nickname?");
        nickname = nickname.trim();
        wt.connect(connected, nickname);
    })

    // Display message with correct format
    // Use regex to parse characters accordingly
    function parseMessage(message) {
        return message
            .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
            .replace(/\*(.*?)\*/g, '<i>$1</i>')
            .replace(/__(.*?)__/g, '<u>$1</u>')
            .replace(/~~(.*?)~~/g, '<s>$1</s>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    // This function is called when the connection to the server is established.
    async function connected() {
        console.log(wt)
        console.log("Connection established.");
        nickname = wt.nickname;
        room_list = wt.availableRooms;
        // let room = wt.join(wt.availableRooms[0].name);
        // current_room = room;

        // Render rooms, clients, and messages after connecting
        setTimeout(() => {
            renderRooms();
        }, 30);

        // CLIENT NAME
        if (wt.registeredNickname !== undefined && wt.registeredNickname) {
            document.getElementById('client-name').innerHTML = "Client Name: " + wt.nickname + "(registered)";
        } else {
            document.getElementById('client-name').innerHTML = "Client Name: " + wt.nickname;
        }

        // only registered user can see the "leave" button
        if (wt.registeredNickname === undefined || !wt.registeredNickname) {
            document.getElementById('leave').style.display = 'none';
        }

        // if user have nickname, then show the client-area
        if (nickname !== null && nickname !== undefined) {
            document.getElementById('client-area').style.display = 'flex';
        }

        // if user have registered, then dont show the login form
        document.getElementById('login-container').style.display = 'none';

        window.send = function (msg) {
            const formattedMsg = parseMessage(msg); // Parse the message before sending
            current_room.send(formattedMsg); // Send the parsed message to the WebSocket or room
        };
        window.login = function (username, password) {
            wt.login(username, password);
        };
        window.logout = function () {
            wt.logout();
        };
    }

    // login by account
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault(); // prevent the default behavior
        nicknameAccountValue = nicknameAccount.value.trim();
        nicknamePasswordValue = nicknamePassword.value.trim();
        if(nicknameAccountValue === "" || nicknamePasswordValue === ""){ 
            alert("Please enter your nickname and password");
            return;
        }
        wt.login(nicknameAccountValue, nicknamePasswordValue);
    })

    // For logout
    document.getElementById('leave').addEventListener('click', function (e) {
        e.preventDefault();
        localStorage.removeItem('message_list');
        console.log("logout");
        document.getElementById('client-area').style.display = 'none';
        document.getElementById('login-container').style.display = 'block';
        wt.logout();
    });

    const sendButtonElement = document.getElementById("send-button");
    sendButtonElement.addEventListener("click", (e) => {

        e.preventDefault();
        const message = msgInputElement.value.trim();
        current_room.send(message);
        msgInputElement.value = '';

    })

    // Function for rendering all rooms
    function renderRooms() {
        let current_room_name;
        const roomListElement = document.getElementById("room-list");
        if (current_room !== undefined) {
            current_room_name = current_room.name;
        } else {
            current_room_name = "";
        }

        // Record which rooms the user is in
        const roomNameUserIsIn = Object.keys(roomUserIsIn);
        roomListElement.innerHTML = ''; // Clear room list

        room_list.forEach(r => {
            if (r.name === current_room_name) {
                roomListElement.innerHTML += `
            <div id="${r.name}" class="channel active">
                <span style="color: white; font-size: 13px;">${r.name}</span>
            </div>`;
            } else {
                roomListElement.innerHTML += `
            <div id="${r.name}" class="channel">
                <span style="color: white; font-size: 13px;">${r.name}</span>
            </div>`;
            }
        });

        roomNameUserIsIn.forEach(r => {
            document.getElementById(r).classList.add('active');

        });

    }

    // To Create a new Chat-box
    function addChatBox() {
        const chatMessagesElement = document.querySelector('.chat-messages');
        let chatBoxName = current_room.name;

        // Listen to users in all rooms leave current room
        const roomNameUserIsIn = Object.keys(roomUserIsIn);

        


        if (document.getElementById("chat-box-" + chatBoxName) !== null) {
            return;
        }

        chatMessagesElement.innerHTML += `
        <div id="chat-box-${chatBoxName}" class="chat-box">
            
                        <div id="chat-box-header-${chatBoxName}" class="chat-box-header">
        <span class="chat-box-title">${chatBoxName}</span>

        <input type="text" id="header-input-${chatBoxName}" class="header-input" placeholder="Search...">

        <div class="chat-box-header-buttons">
            <i id="to-hide-${chatBoxName}" class="fa-solid fa-minus fa-xl" style="color: #8a8f98; padding-right: 20px;"></i>
            <i id="to-leave-${chatBoxName}" class="fa-solid fa-xmark fa-xl" style="color: #8a8f98;"></i>
        </div>
    </div>


                        <div id="checkbox-${chatBoxName}" class="checkbox">
                            <label style="margin-bottom:10px">Filter message</label>
                            <div class="checkbox-content">
                                <div class="checkbox-item">
                                    <input type="radio" id="checkbox-all-${chatBoxName}" name="filter-message-${chatBoxName}" value="all" checked />
                                    <label for="checkbox-all-${chatBoxName}">All</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="radio" id="checkbox-registered-${chatBoxName}" name="filter-message-${chatBoxName}" value="registered" />
                                    <label for="checkbox-registered-${chatBoxName}">Registered</label>
                                </div>
                                <div class="checkbox-item">
                                    <input type="radio" id="checkbox-unregistered-${chatBoxName}" name="filter-message-${chatBoxName}" value="unregistered" />
                                    <label for="checkbox-unregistered-${chatBoxName}">Unregistered</label>
                                </div>
                            </div>
                        </div>



                        <div id="message-list-${chatBoxName}" class="message"></div>
                        <div id="client-list-${chatBoxName}" class="client-list"></div>
                        <!-- Message Input -->
                        <div style="display: flex;">
                            <div style="position:relative;width: 96%;margin-left: 2%">
                                <div class="message-input">
                                    <input id="msg-input-${chatBoxName}" type="text" placeholder="Say hello to everyone">
                                </div>
                            </div>
                            <div
                                style="width:7%;display:none;justify-content:center;align-items:center; background-color: #40444B;border-radius:10px;margin-bottom:10px;margin-left:1vw;cursor: pointer;">
                                <span id="send-button" style="color: white; font-size: 16px;">send</span>
                            </div>
                        </div>
                    </div>
    `


        filterMessages(chatBoxName, checkedInputValue);
        //initial button    
        initializeRadioButtons(chatBoxName);

        // After adding chat box HTML
        const headerInput = document.getElementById(`header-input-${chatBoxName}`);
        headerInput.addEventListener('input', function(event) {
            // Re-filter messages when the search input changes
            filterMessages(chatBoxName, checkedInputValue);
        });
    }

    // Handle changing room
    document.getElementById("room-list").addEventListener('click', function (e) {
        const clickedElement = e.target;
        const idString = clickedElement.id;
        if (idString !== "") {
            // console.log("Switching to room: " + idString);

            room_list.forEach(r => {
                if (idString === r.name) {
                    // wt.leave(current_room.name);

                    current_room = wt.join(idString);
                    roomUserIsIn = wt.joinedRooms;
                    addChatBox();

                    // Avoid duplicating listener additions on hide and leave
                    console.log(current_room)
                    if (current_room.listeners.length === 0) {
                        setTimeout(() => joinRoom(), 50);
                        setTimeout(() => leaveRoom(), 50);
                        setTimeout(() => receiveMessage(), 60);
                        setTimeout(() => printCurrentClients(current_room), 70);
                    }

                    renderRooms();
                    // document.getElementById("chat-header-text").innerHTML = `&nbsp;${current_room.name}
                    //     <span style="color:rgb(179, 187, 197);font-size:14px;font-weight:200;"> | ${current_room.description}</span>`;
                }
            });
        }
    });



    // Installation of the listner for each rooms to receive messages
    function receiveMessage() {
        if (roomUserIsIn === "undefined" || roomUserIsIn === null) {
            return;
        }

        current_room.onMessage((room, msg) => {
            const current_room_name = room.name;

            if (!message_list[current_room_name]) {
                console.log("create new room")
                message_list[current_room_name] = [];
            }
            if (msg.sender !== nickname) {
                message_list[current_room_name].push({ sender: msg.sender, status: msg.registered, message: msg.message, timestamp: new Date().toLocaleString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true }) });
                localStorage.setItem('message_list', JSON.stringify(message_list));
            }
            console.log("!")
            filterMessages(current_room_name, checkedInputValue);
        });
    }


    function initializeRadioButtons(chatBoxName) {
        var radios = document.querySelectorAll('input[name="filter-message-' + current_room.name + '"]');
        radios.forEach(function (radio) {
            radio.addEventListener('change', function () {
                checkedInput = document.querySelector('input[name="filter-message-' + current_room.name + '"]:checked');
                checkedInputValue = checkedInput.value;
                console.log(checkedInputValue);

                filterMessages(chatBoxName, checkedInputValue);
            });
        });
    }


    function filterMessages(chatBoxName, filterType) {
        const messageListElement = document.getElementById(`message-list-${chatBoxName}`);
        const messages = message_list[chatBoxName] || [];

        // Get the current search query from the input field
        const headerInput = document.getElementById(`header-input-${chatBoxName}`);
        const searchQuery = headerInput.value.trim().toLowerCase();


        // clean the history
        // const messagesObj = JSON.parse(localStorage.getItem('message_list')) || {};
        // const messages = messagesObj[chatBoxName] || [];
        // console.log(messages);

        // Clear the current message list
        messageListElement.innerHTML = '';

        // according to type to filter the messages => Child scope
        const filteredMessages = messages.filter((msg) => {
            let typeMatch = false;
            if (filterType === 'all') {
                typeMatch = true;
            } else if (filterType === 'registered') {
                typeMatch = msg.status === true;
            } else if (filterType === 'unregistered') {
                typeMatch = msg.status === false;
            }

            // Check if message content or sender matches the search query
            let searchMatch = true;
            if (searchQuery) {
                // Make search case-insensitive
                const messageContent = msg.message.toLowerCase();
                const senderName = msg.sender.toLowerCase();
                searchMatch = messageContent.includes(searchQuery) || senderName.includes(searchQuery);
            }

            return typeMatch && searchMatch;
        });

        console.log(filteredMessages);

        // re-render the message list
        filteredMessages.forEach((msg) => {
            let messageContent;
            if (msg.status) {
                messageContent = `<div style="margin-left: 10px; margin-top: 10px">
                <span style="font-weight: 500; color: ${msg.sender === nickname ? '#d29e4f' : '#518948'}; font-size: 17px">${msg.sender}(registered)</span>
                <span class="timestamp">${msg.timestamp}</span>
                <div class="content">${parseMessage(msg.message)}</div>
            </div>`;
            } else {
                messageContent = `<div style="margin-left: 10px; margin-top: 10px">
                <span style="font-weight: 500; color: ${msg.sender === nickname ? '#d29e4f' : '#518948'}; font-size: 17px">${msg.sender}</span>
                <span class="timestamp">${msg.timestamp}</span>
                <div class="content">${parseMessage(msg.message)}</div>
            </div>`;
            }
            
            messageListElement.innerHTML += messageContent;
        });
    }





    // Handle joining room => joinListener
    function joinRoom() {
        // for user self
        let current_room_element = document.getElementById("message-list-" + current_room.name)
        if (current_room_element !== null) {
            current_room_element.innerHTML += `<div style="font-size:12px;display:flex;justify-content:center;color:grey"> <span>${nickname} joined ${current_room.name}</span></div>`;
        }
        // Listen to all rooms that have been joined
        current_room.onJoin((room, nickname) => {
            document.getElementById("message-list-" + room.name).innerHTML += `<div style="font-size:12px;display:flex;justify-content:center;color:grey"><span>${nickname} joined ${room.name}</span></div>`;
            printCurrentClients(room)
        });
    }

    // Handle leaving room => leaveListener
    function leaveRoom() {
        // Listen to users in all rooms leave current room
        const roomNameUserIsIn = Object.keys(roomUserIsIn);
        current_room.onLeave((room, nickname) => {
            document.getElementById("message-list-" + room.name).innerHTML += `<div style="font-size:12px;display:flex;justify-content:center;color:grey"><span>${nickname} left ${room.name}</span></div>`;
            printCurrentClients(room)
            console.log(room)
        });

    }

    // Function for printing current clients
    // room_tmp design for callback function
    function printCurrentClients(room_tmp) {
        const clients = room_tmp.clients || [];
        console.log(room_tmp);
        let client_list_element = document.getElementById("client-list-" + room_tmp.name);
        client_list_element.innerHTML = ""; // Clear the client list
        client_list_element.innerHTML += `<div class="client-list-header">Client List</div>`; // 添加标题
        clients.forEach(client => {
            if (client.registered !== undefined) {
                client_list_element.innerHTML += `<div class="client-list-item">${client.nickname}(registered)</div>`;
            } else {
                client_list_element.innerHTML += `<div class="client-list-item">${client.nickname}</div>`;
            }
        });


        function initializeDragging() {
            console.log("initializeDragging");
            // Use JavaScript's mousedown, mousemove, and mouseup events to implement drag effects
            let currentChatBoxName = 'chat-box-' + current_room.name;
            let currentChartBoxHeaderName = 'chat-box-header-' + current_room.name;
            let chatBox = document.getElementById(currentChatBoxName);
            let chatBoxHeader = document.getElementById(currentChartBoxHeaderName);

            // offsetX and offsetY means the total offset from the start of dragging to the current position
            // clientX: the horizontal coordinate (in pixels) of the mouse pointer relative to the left edge of the browser viewport.
            // clientY: the vertical coordinate of the mouse pointer relative to the top edge of the browser viewport(in pixels).
            let offsetX = 0, offsetY = 0, initialX = 0, initialY = 0, isDragging = false;

            // Mouse press event on the chat-box-header to start dragging
            chatBoxHeader.addEventListener('mousedown', function (e) {
                isDragging = true;

                // Calculates the relative position of the mouse inside the chatBox.
                initialX = e.clientX - chatBox.offsetLeft; // Calculate initial mouse position relative to chatBox
                initialY = e.clientY - chatBox.offsetTop;

                document.addEventListener('mousemove', moveBox); // Add mousemove event to document to track dragging
                document.addEventListener('mouseup', stopDragging); // Add mouseup event to stop dragging
            });
            // Update the position of the chat-box when moving the mouse
            function moveBox(e) {
                if (isDragging) {
                    offsetX = e.clientX - initialX; // Calculate new position
                    offsetY = e.clientY - initialY;
                    chatBox.style.left = `${offsetX}px`; // Update chatBox position
                    chatBox.style.top = `${offsetY}px`;
                }
            }

            // Mouse up event to stop dragging
            function stopDragging() {
                isDragging = false;
                document.removeEventListener('mousemove', moveBox); // Remove mousemove and mouseup event listeners
                document.removeEventListener('mouseup', stopDragging);
            }
        }

        // Select a room by clicking on chat-box and change it to be current room
        document.querySelector('.chat-messages').addEventListener('click', function (event) {

            // if there's no current room, then return
            if (current_room === undefined || current_room === null) {
                return;
            }

            // to get the clicked element
            const clickedElement = event.target;
            const elementId = clickedElement.id;

            let idArray = elementId.split("-");
            // to get current room name when clicking on chat-box
            let current_room_name = idArray[idArray.length - 1];

            // to get the current room element to set h-index
            let currentRoomElement = document.getElementById(`chat-box-${current_room_name}`);
            // currentRoomElement.classList.toggle('chat-box-h-index');

            // to get the instantiated object of the room
            current_room = wt.join(current_room_name);
            initializeDragging();

            // to set z-index
            const chatBoxes = document.querySelectorAll('.chat-box');

            chatBoxes.forEach(chatBox => {
                chatBox.addEventListener('mousedown', function () {
                    bringToFront(chatBox);
                });
            });

            function bringToFront(selectedChatBox) {
                let maxZ = 0;
                chatBoxes.forEach(chatBox => {
                    const zIndex = parseInt(window.getComputedStyle(chatBox).zIndex) || 0;
                    if (zIndex > maxZ) {
                        maxZ = zIndex;
                    }
                });
                selectedChatBox.style.zIndex = maxZ + 1;
            }

            // Format selected text with hotkeys
            function wrapSelection(tag) {
                const input = document.getElementById("msg-input-" + current_room_name);
                const start = input.selectionStart;
                const end = input.selectionEnd;
                const text = input.value;

                // Apply format only with the text selected
                if (start !== end) {
                    input.value = text.substring(0, start) + tag + text.substring(start, end) + tag + text.substring(end);
                    input.setSelectionRange(end + tag.length, end + tag.length);
                }
                input.focus();
            }

            // Handle sending messages on Enter key press
            const msgInputElement = document.getElementById("msg-input-" + current_room_name);
            msgInputElement.addEventListener("keydown", (e) => {
                // Bold Ctrl + B
                if (e.ctrlKey && e.key === "b") {
                    e.preventDefault();
                    wrapSelection("**");
                }

                // Italic Ctrl + I
                if (e.ctrlKey && e.key === "i") {
                    e.preventDefault();
                    wrapSelection("*");
                }

                // Underline Ctrl + U
                if (e.ctrlKey && e.key === "u") {
                    e.preventDefault();
                    wrapSelection("__");
                }

                // Strikethrough Ctrl + S
                if (e.ctrlKey && e.key === "s") {
                    e.preventDefault();
                    wrapSelection("~~");
                }

                // Monospace ``
                if (e.ctrlKey && e.key === "`") {
                    e.preventDefault();
                    wrapSelection("`");
                }
                if (e.key === "Enter") {
                    e.preventDefault();
                    const message = msgInputElement.value.trim();
                    if (message !== "") {
                        current_room.send(message);
                        message_list[current_room_name].push({ sender: nickname, status: wt.registeredNickname, message: message, timestamp: new Date().toLocaleString('en-GB', { hour: 'numeric', minute: 'numeric', hour12: true }) });
                        localStorage.setItem('message_list', JSON.stringify(message_list));
                        //  console.log(message_list);
                        msgInputElement.value = '';

                    }
                }
            });

            // document.getElementById("msg-input-" + current_room_name).addEventListener("keydown", (e) => {});
        });

        // Event listener for minimizing chat boxes using the minimize button
        document.querySelector('.chat-messages').addEventListener('click', function (event) {
            const clickedElement = event.target;
            const elementId = clickedElement.id;
            let idArray = elementId.split("-");
            let current_room_name = idArray[idArray.length - 1];

            if (elementId.includes('to-hide')) {
                const chatBox = document.getElementById(`chat-box-${current_room_name}`);
                chatBox.classList.add('chat-box-hidden');
            }
        });

        // show chat-box again when click on siderbar
        document.getElementById("room-list").addEventListener('click', function (e) {
            const clickedElement = e.target;
            const idString = clickedElement.id;
            console.log(idString)
            if (idString !== "") {
                const chatBox = document.getElementById(`chat-box-${idString}`);
                chatBox.classList.remove('chat-box-hidden');
            }
        });

        // Event listener for leave room by using the close button and delete the chat-box
        document.querySelector('.chat-messages').addEventListener('click', function (event) {

            const clickedElement = event.target;
            const elementId = clickedElement.id;
            let idArray = elementId.split("-");
            let current_room_name = idArray[idArray.length - 1];

            if (elementId.includes('to-leave')) {
                const chatBox = document.getElementById(`chat-box-${current_room_name}`);
                wt.leave(current_room_name);
                document.getElementById(current_room_name).classList.remove('active');
                chatBox.remove();
            }
        });
    }