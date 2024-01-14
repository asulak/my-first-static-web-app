
"""
    A: Train ChatBot
    B: Write Chat Results to Database


"""



# A: FINE TUNE (TRAIN) CHAT BOT

import json
import openai
import os
import pandas as pd
from pprint import pprint

OPEN_AI_KEY = "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"
openai.api_key = OPEN_AI_KEY

# Read the training guide for the task 

question_df = pd.read_csv("INSERT CSV")

# Fine tune with ChatCompletion format, each training example a list of messages. 

city = "Kalamazoo"
state = "Michigan"
property = "Drakes Pond"


training_data = []

# Prompt for ChatBot 

system_message = f"You are a leasing agent at {property} in {city}, {state}. Your objective is to lease apartments to those looking for a place to rent and keep existing residents happy. Look to see if someone's question 
semantically matches."

def create_user_message(row):
    return f"""Question: {row['Question']}\n\nAnswer: {row['Answer']}\n\nAnswer: """

def prepare_existing_conversation(row):
    messages = []
    # Instruct the chatbot with what to do 
    messages.append({"role": "system", "content": system_message})
    
    # Create a row with a question and its answer 
    user_message = create_user_message(row)
    
    # Append the question's correpsponding answer 
    messages.append({"role": "assistant", "content": row["Answer"]})
    
    return {"messages": messages}

# Pretty print the function result 
pprint(prepare_existing_conversation(question_df.iloc[0]))

# Use the first 30 rows of the dataset for training. 
training_df = question_df.loc[0:30]

# Apply the prepare_example_conversation function to each row of the training df. 
training_data = training_df.apply(prepare_existing_conversation, axis=1).tolist() 

# In addition to training data, we can also provide validation ata, which will be used to make sure the model
# does not overfit your training set
validation_df = question_df.loc[30:50]
validation_data = validation_df.apply(prepare_existing_conversation, axis=1).tolist()

# Save data as jsonl files. Each line is one training example conversation.
# Data list represents our training or validation data list, and the filenames in both cases are represented as strings
def write_jsonl(data_list:list, filename: str) -> None:
    with open(filename, "w") as json_file:
    
        for item in data_list:
        
            # Dump each list item to a json string. 
            json_string = json.dumps(item) + "\n"
            
            # Write the string created above into the json file 
            json_file.write(json_string)
            
# Write training set data into jsonl files for ChatGPT
training_file_name = "leasing_agent_finetune_training.jsonl"
write_jsonl(training_data, training_file_name)

# Write validation data into jsonl files for ChatGPT
validation_file_name = "leasing_agent_finetune_validation.jsonl"
write_jsonl(validation_data, validation_file_name)

# Upload training files to ChatCompletions files endpoint to be used by fine-tned model
with open(training_file_name, "rb") as training_file:
    training_response = openai.files.create(
        file=training_file, purpose="fine-tune"
    )
    
# Id of training and validation file 
training_file_id = training_response.id  
  
# Upload validation files to ChatCompletions files endpoint to be used by fine-tned model
with open(validation_file_name, "rb") as validation_file:
    validation_response = openai.files.create(
        file=training_file, purpose="fine-tune"
    )
    
# Id of training and validation file 
validation_file_id = training_response.id  
  
# Fine Tuning
# Now we create or fine-tuning job with the generated files. The response contains an id you can use to retrieve updates on the fine tuning job. 
response = openai.fine_tuning.jobs.create(
    training_file=training_file_id,
    validation_file=validation_file_id,
    model="gpt-3.5-turbo",
    suffix="leasing_agent"
)

job_id = response.id

# After fine tuning is done, we can get a fine-tuned model ID from the job
response = openai.fine_tuning.jobs.retrieve(job_id)

# Name of fine tuned model being created
fine_tuned_model_id = response.fine_tuned_model

if fine_tuned_model_id is None:
    raise RuntimeError("Fine-tuned model ID not found. Your job most likely has not been completed yet.")

# Use fined tuned model for inference (on testing set). Call ChatCOmpletions wiht your new fine-tuned mode name filling the model parameter.

test_df = question_df.loc[50:300]
test_row = test_df.iloc[0]
test_messages = []
test_messages.append({"role": "system", "content": system_message})
user_message = create_user_message(test_row)
test_messages.append({"role": "user", "content": create_user_message(test_row)})

pprint(test_messages)

response = openai.chat.completions.create(
    model=fine_tuned_model_id, messages=test_messages, temperature=0, max_tokens=500
)

print(response.choices[0].message.content)

# When a job has succeeded, you will see the fine_tuned_model field populated with the name of the model when you retrieve the job details. You may now specify this model as a parameter to in the Chat Completions (for gpt-3.5-turbo) or legacy Completions API (for babbage-002 and davinci-002), and make requests to it using the Playground.