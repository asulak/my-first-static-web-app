# uvicorn main:app
# uvicorn main:app --reload

# Main imports
from fastapi import FastAPI
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
import openai
import json

# Get Environment Vars
# openai.organization = "config("OPEN_AI_ORG")"
openai.api_key = "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"

# Initiate App
app = FastAPI()


# CORS Origins from which we will allow HTTP requests from 
origins = [
    "*"
]
# CORS - Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],    
    expose_headers=["*"]
)

"""
CUSTOM FUNCTIONS
"""

# In script.js, prepare a messages array with the system, user, and assistant roles and responses
# Call a backend function that turns the messages array into a dataframe
# Create SQL table
# Write query

# Store messages for retrieval later on 
@app.post("/messages-to-database/")
async def store_messages(outgoing_message, incoming_message):

  # Define the file name
  file_name = "stored_data.json"
  
  # Function to get messges from json
  
  def get_recent_messages():

    # Define the file name
    file_name = "stored_data.json"
    # learn_instruction = {"role": "system", 
                       # "content": "You are a friendly chatbot."}
    
    # Initialize messages
    messages = []

    # Append instruction to message
    # messages.append(learn_instruction)

    # Get last messages
    try:
        with open(file_name) as user_file:
            data = json.load(user_file)
        
        # Append last 5 rows of data
        if data:
            if len(data) < 5:
                for item in data:
                    messages.append(item)
            else:
                for item in data[-5:]:
                    messages.append(item)
    except:
        pass
    
    # Return messages
    return messages

  # Get recent messages
  messages = get_recent_messages()[1:]

  # Add messages to data
  user_message = {"role": "user", "content": outgoing_message}
  assistant_message = {"role": "assistant", "content": incoming_message}
  messages.append(user_message)
  messages.append(assistant_message)

  # Save the updated file
  with open(file_name, "w") as f:
    json.dump(messages, f)

