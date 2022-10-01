import React, { useRef } from 'react'
import io from 'socket.io-client';
import { useEffect, useState } from 'react';
//import { v4 as uuidv4 } from 'uuid';

const socket = io("http://localhost:5000/");

function Chat() {

    const [joinNotification, setJoinNotification] = useState('');
    const [text, setText] = useState('');
    const [messages, setMessages] = useState([]);
    const [imageFile, setImageFile] = useState('');
    const [sendLoading, setSendLoading] = useState(false);
    const [receiveLoading, setReceiveLoading] = useState(false);

    socket.emit('join', {roomId: 123, userId: socket.id});

    const ref = useRef();

    const handleSubmit = (e) =>{
        e.preventDefault();
        socket.emit('send', {text: text, roomId: 123, userId: socket.id});
        setText("");
    }

    const handleImageUpload = async(e) =>{
        e.preventDefault();
        console.log(imageFile);
        setSendLoading(true);
        const imageObject = {
            roomId: 123,
            userId: socket.id,
            body: imageFile,
            mimeType: imageFile.type,
            fileName: imageFile.name,
        }
        const base64 = await convertBase64(imageFile);
        socket.emit("uploadImage", base64, imageObject, (response) =>{
            console.log(response.status);
            console.log(response.base64);
            setSendLoading(false);
        });
        ref.current.value = "";
    }

    const convertBase64 = (imageFile) =>{
        return new Promise((resolve, reject) =>{
            const fileReader = new FileReader();
            fileReader.readAsDataURL(imageFile);
            fileReader.onload = () =>{
                resolve(fileReader.result);
            };
            fileReader.onerror = (err) => {
                reject(err);
            }
        })
    }

    useEffect(() => {
        socket.on("connect", () => {
            console.log(socket.id); 
        });
        socket.on('sendJoinNotification', (data) =>{
            setJoinNotification(data.text);
        });
        socket.on('receive', (data) =>{
            setMessages([...messages, {text: data.text}]);
            console.log(messages)
        });
        socket.on('getImageNotification', (data) =>{
            console.log(data.imageNotification);
            setReceiveLoading(true);
        })
        socket.on("getImage", (data) =>{
            async function fetchBase64() {
                const response = await data.base64;
                console.log(response);
            }
            fetchBase64();
            setReceiveLoading(false);
            setMessages([...messages, {base64: data.base64, userId: data.userId}]);
        });

    });
    
    return (
        <>
            <div>
                <h3>{joinNotification}</h3>
                <form onSubmit={handleSubmit}>
                    <input type="text" value={text} onChange={(e) =>{setText(e.target.value)}}/>
                    <button>Send</button>
                </form>
                <p>Image Upload</p>
                <form onSubmit={handleImageUpload}>
                    <input type="file" onChange={(e) => {setImageFile(e.target.files[0])}} ref={ref}/>
                    <button>Send Image</button>
                </form>
                {(sendLoading && imageFile != null) ? <h1>Sending...</h1> : <></>}
                {(receiveLoading) ? <h1>loading...</h1> : (imageFile === '') ? <></> : <h1>Image</h1>}
                <hr />
                {messages.map((payload, index) =>{
                    return(
                        <div key={index}>
                            <p>{payload.text}</p>
                            {(payload.base64 != null) ? <img src={payload.base64} alt="img" width="250" height="200"></img> : <></>}
                        </div>
                    )
                })}
            </div>
        </>
    )
}

export default Chat;