import React, { useEffect, useRef, useState } from 'react'
import EmojiPicker from 'emoji-picker-react'
import './chat.css'
import { arrayUnion, doc, getDoc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from '../../lib/firebase'
import { useChatStore } from '../../lib/chatStore'
import { useUserStore } from '../../lib/userStore'
import upload from '../../lib/upload'

const Chat = () => {

  const [chat, setChat] = useState()
  const [open, setOpen] = useState(false)
  const [text, setText] = useState("")
  const [img, setImg] = useState({
    file: null,
    url: "",
  })

  const { currentUser } = useUserStore();
  const { chatId, user, isCurrentUserBlocked, isReceiverBlocked } = useChatStore();

  const endRef = useRef(null)

  useEffect( () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [])

  useEffect(() => {
    const unSub = onSnapshot(doc(db, "chats", chatId), (res) => {
      setChat(res.data());
    })

    return () => {
      unSub();
    }
  }, [chatId])

  console.log(chat)

  const handleEmoji = e => {
    setText( (prev) => prev + e.emoji)
    setOpen(false)
  }

  const handleImg = e => {
    if (e.target.files[0]) {
        setImg({
            file: e.target.files[0],
            url: URL.createObjectURL(e.target.files[0])
        })
    }
}

  // console.log(text)

  const handleSend = async () => {
    if(text === "") return;

    let imgUrl = null;
    
    try {
      if (img.file) {
        imgUrl = await upload(img.file);
      }

      await updateDoc(doc(db, "chats", chatId), {
        messages:  arrayUnion({
          senderId: currentUser.id, 
          text,
          createdAt: new Date(),
          ...(imgUrl && { img: imgUrl }),
        })
      })

      const userIds = [currentUser.id, user.id];

      userIds.forEach(async (id) => {
        const userChatRef = doc(db, "userchats", id)
        const userChatsSnapshot = await getDoc(userChatRef)
  
        if(userChatsSnapshot.exists()) {
          const userChatData = userChatsSnapshot.data()
  
          const chatIndex = userChatData.chats.findIndex( 
            (c) => c.chatId === chatId
          );

          if (chatIndex !== -1) {
            userChatData.chats[chatIndex].lastMessage = text;
            userChatData.chats[chatIndex].isSeen = id === currentUser.id;
            userChatData.chats[chatIndex].updatedAt = Date.now();
    
            await updateDoc(userChatRef, {
              chats: userChatData.chats,
            });
          } else {
            console.error(`Chat with ID ${chatId} not found for user ${id}`);
          }
        } else {
          console.error(`User chat data not found for user ${id}`);
        }
  
          // userChatData.chats[chatIndex].lastMessage = text;
          // userChatData.chats[chatIndex].isSeen = id === currentUser.id ? true : false;
          // userChatData[chatIndex].updatedAt = Date.now();
  
          // await updateDoc(userChatRef, {
          //   chats: userChatData.chats,
          // });
        
      });

     
    } catch (err) {
      console.log(err);
    }

    setImg({
      file: null,
      url: "",
    });

    setText("");
  }

  return (
    <div className='chat'>

      <div className="top">
        <div className="user">
          <img src={user?.avatar || "./avatar.png"} alt="" />
          <div className="texts">
            <span>{user?.usernmae}</span>
            <p>Lorem ipsum dolor sit amet.</p>
          </div>
        </div>
        <div className="icons">
          <img src="./phone.png" alt="" />
          <img src="./video.png" alt="" />
          <img src="./info.png" alt="" />
        </div>
      </div>

      <div className="center">

        { chat?.messages?.map(message => (
          <div className= {message.senderId === currentUser?.id ? "message own" : "message" } key={message?.createdAt}>
           <div className="texts">
          {message.img && <img 
          src={message.img}
          alt="" />}
            <p>{message.text}</p>
            {/* <span>1 min ago</span> */}
          </div>
        </div>
        ))}
        
        {img.url && (
          <div className="message own">
            <div className="texts">
              <img src= {img.url} alt="" />
            </div>
          </div>
        )}

        <div ref={ endRef } ></div>
      </div>
      
      <div className="bottom">
        <div className="icons">
          <label htmlFor="file">
            <img src="./img.png" alt="" />
          </label>
          <input type="file" id='file' style={{display: "none"}}
          onChange={handleImg}
          />
          <img src="./camera.png" alt="" />
          <img src="./mic.png" alt="" />
        </div>
        <input 
          type="text" 
          placeholder= {
            (isCurrentUserBlocked || isReceiverBlocked)
            ? "You cannot send a message " 
            : "Type a message....."
          }
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        />
        <div className="emoji">
          <img 
          src="./emoji.png" 
          alt="" 
          onClick={ () => setOpen((prev) => !prev)}
          />
          <div className="picker">
            <EmojiPicker open={open} onEmojiClick={handleEmoji}/>
          </div>
        </div>
        <button className='sendButton' onClick={handleSend} 
          disabled={isCurrentUserBlocked || isReceiverBlocked}
        >Send</button>
      </div>
    </div>
  )
}

export default Chat
