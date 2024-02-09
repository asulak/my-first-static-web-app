// VARIABLE DECLARATIONS

// const declares a variable that cannot be reassigned to a new value. 
// document.querySelector returns the first element that matches a CSS selector. If we wanted to return all matches (not only the first), we'd use querySelectorAll() 

const openChatbot = document.querySelector(".open-chatbot");  // Switches state of chatbot from open to closed 
const closeChatbot = document.querySelector(".close-btn");  // When the chat is open, this is the "X" that shows at the bottom right */
const chatMessageStorage = document.querySelector(".chat-message-storage"); /* This is what holds our chat messages */
const textBox = document.querySelector(".text-box textarea");  /* The text area is housed in the text box */
const sendButton = document.querySelector(".text-box span");   /* This is the green arrow that appears when you start typing in the text box */
const textBoxHeight = textBox.scrollHeight;   // scrollHeight is the minimum height the element requires in order to fit all content in the viewport without using a vertical scrollbar 

// let declares a variable that can be reassigned another value
// Both let and const are block-scoped, meaning they can be accessible within curly braces. Curly braces group blocks of code and execute them together. 

let typedMessage = null; // Variable to store user's message. The default value is null. 

// // AZURE SECRET

// // Include required dependencies
//import {DefaultAzureCredential} from './node_modules/@azure/identity';
//import {SecretClient} from './node_modules/@azure/keyvault-secrets';

require('@azure/identity');
require('@azure/keyvault-secrets');

//import {DefaultAzureCredential} from "./node_modules/@azure/identity";
//import {SecretClient} from "./node_modules/@azure/keyvault-secrets";

// // Authenticate to Azure
const credential = new DefaultAzureCredential(); 

// // Create SecretClient
const vaultName = '<ChatbotTest>';  
const url = `https://${vaultName}.vault.azure.net`;  
const client = azure-keyvault-secrets.SecretClient(url, credential);  

// // Get secret
const API_KEY = await client.getSecret("OpenAI");

// EVENT LISTENERS

// Adjust the textbox height based on the content inside 
textBox.addEventListener("input", () => {
    // Adjust the height of the input textarea based on its content
    textBox.style.height = `${textBoxHeight}px`;
    textBox.style.height = `${textBox.scrollHeight}px`;
});

// If a user presses enter, send a message
textBox.addEventListener("keydown", (e) => {
    // If Enter key is pressed without Shift key and the window 
    // width is greater than 800px, handle the chat
    if(e.key === "Enter" && !e.shiftKey && window.innerWidth > 800) {
        e.preventDefault();  /* Override default behavior from browser */
        handleChat();   /* Call handleChat funtion defined later. In JS, functions can be called before they are defined. */
    }
});

// FUNCTIONS

//  Saves previously received answers in an array that will be sent to ChatGPT for context 
function storeMessage(messages) {
    const memory = [];  /* Will end up being a list of dictionaries */
    for (const msg of messages) {
    memory.push({ role: msg.role, content: msg.content });  /* Push adds an item to the end of a list */
    }
    return memory;
    };

// Provides initial instructions to ChatGPT
const chatMemory = storeMessage([
    {
      role: "system",
      content: "You are a personable, entertaining chatbot."
    }
  ]);

// Parentheses () in JS are used for function parameters, to surround conditional statments, or for executing code in blocks.
// Curly braces {} in JS are used to declare object literals or to enclose blocks of code 

const createChatLi = (message, className) => {   
    // Create a chat <li> element with passed message and className
    const chatLi = document.createElement("li");  /* Creates list HTML element. JavaScript can be used to modify HTML. */
    chatLi.classList.add("chat", `${className}`);  /* classList.add adds one or more class names to the specified element */
    // === is a strict equality operator. Two values must be equal and of the same type.
    // A conditional ternary operator takes three operands - a condition followed by a question mark (?), then an expression to execute if the condition is
    // truthy, followed by a colon, and the expression to execute if the condition is falsy 
    let chatContent = className === "outgoing" ? `<p></p>` : `<span class="material-symbols-outlined">voice_chat</span><p></p>`;
    // Sets or returns all the HTML content of an element. 
    chatLi.innerHTML = chatContent;
    // The textContent property returns the text content of the specified node and its descendants  
    chatLi.querySelector("p").textContent = message;
    // Equivalent to print() in Python. 
    console.log()
    return chatLi; // return the chatLi element 
}

// Function that details what to do with user-typed messages 
const handleChat = () => {
    typedMessage = textBox.value.trim(); // The value property sets or returns the value of the value attribute of a text field. .trim() removes whitespace from both ends of the string.
    if(!typedMessage) return;   // If no textbox value, exit function

    // Clear the input textarea and set its height to what it was before the user started typing 
    textBox.value = "";
    textBox.style.height = `${textBoxHeight}px`;

    // Append the user's message to the chatMessageStorage. appendChild() appends a node (element) as the last child of an element.
    // We create a new list element with the typed message with a class of outgoing.  
    chatMessageStorage.appendChild(createChatLi(typedMessage, "outgoing"));
    // Now we update the scroll height 
    chatMessageStorage.scrollTo(0, chatMessageStorage.scrollHeight);
    
    // There will be a gap between when we send a message and when we get a response. This function details what to do during that time.
    // setTimeout() method sets a timer which executes a function or a specified piece of code once the timer expires. setTimeout(code, delay) 
    setTimeout(() => {
        // While waiting for the response, we display a "Thinking..." message with the attributes of the "incoming" class 
        const incomingChatLi = createChatLi("Thinking...", "incoming");
        chatMessageStorage.appendChild(incomingChatLi);
        chatMessageStorage.scrollTo(0, chatMessageStorage.scrollHeight);
        // We're triggering the generateResponse function based on the "Thinking..." bubble. 
        // What we actually send to openAI will be different. 
        generateResponse(incomingChatLi); 
    }, 600);  /* In MS */
}

// This function generates a response from chatGPT. The function parameter name is arbitrary; it represents an input 
const generateResponse = (chatElement) => {
    // OpenAI Endpoint
    const API_URL = "https://api.openai.com/v1/chat/completions";
    const messageElement = chatElement.querySelector("p");

    // Define the API request method, its headers (meta-data associated with request), the body (data sent by your client, say a browser, to the API) 
    const requestOptions = {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${API_KEY}`
        },
        body: JSON.stringify({   /* When sending data to a web server, the data has to be a string. We convert a JS object into a string with JSON.stringify(). */
            model: "gpt-3.5-turbo",
            messages: [            /* All our past messages and the most recent one are passed as a list of dictionaries */
                ...chatMemory,
                {role: "user", content: typedMessage}]
        })   /* Terminates the JSON.stringify method */
    }    /* Terminates the nested requestOptions function. */
    // Note we haven't yet ended the generateResponse function. 

    // CALL THE PYTHON FUNCTION CONTAINING THE API KEY 
    
    // The fetch method starts the process of fetching a resource from a server. It returns a Promise, an object that represents the eventual completion or failure of
    // an asychronous operation (lets us start long-running tasks while running others in parallel). A promise resolves to a response object as a value, a thenable, or an error

    // First, we send the API_URL and a second optional argument that includes the request want to make to the API. 
    // We get the promise resolved as a thenable, which takes the response object and reads it to completion. It returns a promise which resolves with the result of parsing the body text as JSON.
    // IMPORTANT: res.json() does not result in json. It takes JSON as an input and parses it to produce a JavaScript object.  
    
    fetch(API_URL, requestOptions).then(res => res.json()).then(data => {
        // data is a dictionary returned to us from chatGPT. We access the choices property, an array of text completion objects, but hone in on the first text completion object. The first
        // text completion object has a 'message" object that has a "content" property with the chat completion. 
        messageElement.textContent = data.choices[0].message.content.trim();
        // Obviously needed help with this one. 
        //var cleanResponse = chatGPTResponse.replace(/(```html|```css|```javascript|```php|```python)(.*?)/gs, '$2');
       // cleanResponse = cleanResponse.replace(/```/g, "");

       // Define our request_message and response_messages variables, which we'll add to the ChatMemory function we defined outside 
       const request_message = [{role: "user", content: typedMessage}]
       const response_message = [{role: "assistant", content: messageElement.textContent}]
       
         // Push the latest user message and chatbot response into the chatMemory array 
         chatMemory.push(request_message)
         chatMemory.push(response_message)
         return chatMemory;
    // A catch block contains statements that specify what to do if there's an error 
    }).catch(() => {
        messageElement.classList.add("error");
        messageElement.textContent = "Oops! Something went wrong. Please try again.";
    // The finally method of Promise instances schedules a function to be called when a promise is settled (fulfilled or rejected)
    }).finally(() => chatMessageStorage.scrollTo(0, chatMessageStorage.scrollHeight))};   /* Executes whether there's a valid response or an error */

    // An asychrnouous nested function (still part of generateResponse) takes both outgoing and incoming chat messages. 

//     const postMessagestoDatabase = async(request_message, response_message) => {n
//         try {
//             // The await keyword can only be used inside an async function. The await keyword makes the function pause the execution and wait for a resolved promise before it continues.  
//             // With axios.post, the first parameter is the URL, the second parameter is the request body, and the 3rd parameter is the options.
//             const response = await axios.post("http://localhost:8000/messages-to-database", {
//         // When making a POST request, we include parameters in the request body 
//         params: {
//          request_message,
//         response_message},
//         // 
//         headers: {
//             "Access-Control-Allow-Credentials": true,  /* This header, when set to true, tells browsers to expose the response to our JS Code. Credentials include auth headers from the CORS preflight request */  
//             'content-type': 'text/json'
//         }});
//         console.log(response)
//     } catch (err) {
//         console.error(err);
//     }

// postMessagestoDatabase()

// Event listeners for sendButton, closeChatBot, and openChatbot. 
// The addEventListener() function is in-built in JS that takes an event to listen for and a second argument to alled whenever the described event is fired  
sendButton.addEventListener("click", handleChat);
closeChatbot.addEventListener("click", () => document.body.classList.remove("show-chatbot"));
openChatbot.addEventListener("click", () => document.body.classList.toggle("show-chatbot"));