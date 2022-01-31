# Interview Extension: System Design

## Next Steps

Congrats in getting to the next step in the technical evaluation. The goal of this part is to exercise of system design skills.

- Assuming that chat messages are going to persisted in a data store. As a design exercise, build a robust data pipeline which is able to:
  - perform aggregation of number of chat messages by user and by date.
  - perform sentiment analysis of the chat messages to give a score of +1 on positive, -1 on negative and 0 on unknown/unable to score.

## Output expected

Create the design using a markdown document. Feel free to use diagrams and make note of the assumptions you are making. Feel free to assume availability of third party library/services to perform complicated processing such socket management or sentiment analysis. Please make sure to highlight the dependencies in the design. Optionally, list out benefits and limitations of the design. For the data pipeline exercise, define schemas for input and output data so that they are easily consumable and queryable.

If you can think of more than one way, we encourage you to list them as alternatives.

# Proposed Architecture

In the below  diagram we have the following
  - **API Gateway** (**Apollo gateway** or **Appsync**) exposes the system schema
  - **Message service** (Node.js service)(Auto-scaled service that handles message related requests) and pushes messages a topic
  - **Postgres stateful set** / AWS managed service (**RDS**) (where we save data bulk insert messages and conference states (aggregates in json - periodically from Redis snapshots)
  - **Redis stateful set** / AWS managed service (**ElastiCache**) (conference state, recent messages from a conference and recent sentiment aggregation)
  - **Inference pod** (running a tensorflow model) / AWS managed service (**Amazon Comprehend**) accessible through AWS SDK  (sentiment analysis)
  - **Message aggregator** (Node.js service) that aggregates sentiment of messages
  - **Kafka Ecosystem** / **Amazon MSK** (Kafka statefulset, Zookeeper)
  - **Timescale DB** (Time series database) / **AWS Document DB** (Managed Mongodb)
  - **Subscription service** (manages websockets and pub/sub for client relevant events) 

  All service to service communication will be done through **Kafka** with Kafka.js library, on each producer and consumer we will also have a validation with **AJV** or **Joi**  (prefer AJV because it's faster) for messages (events), we can also look into incorporating Avro schema and schema registry to enforce message schemas;
     
![Proposed architecture](/system-design/Data_Pipeline.drawio.svg?raw=true)



# API Gateway
  - exposes system schema and forwards requests to the corresponding service resolver
  

# Message Service
  - has resolvers that handle message related requests such as 
      - create (mutation)
      - read (query)
      - update (mutation)
      - delete (mutation)    
        
    Create, update, delete events are saved to the **Postgres DB** and also pushed to a kafka topic and consumed in:
      - **Subscription pod** that sends updates to the rest of the clients that need to consume those updates (Other people in the chat so their local in browser state gets updated with websocket subscription)
      - **Inference Pod** that performs sentiment analysis on the content of the message
      - save latest messages in Redis

    Read is done from **Redis** for a chat refresh (temporary chat state stored in redis), entries older that the first message from memory are retrieved from db via a separate endpoint
    
# Postgres

Tables that will be implemented
## Messages Table

| Column name | Type | Example  | Description  |
|---|---|---|---|
| ID | VARCHAR(36)  |  ce47db5b-7d7b-4e33-a1e9-1df769c80112 |  Id of message resource |
| UserId  | VARCHAR(36) |  ce47db5b-7d7b-4e33-a1e9-1df769c80113  | Id of user message belongs to  |
| ChatRoomId  | VARCHAR(36)  | ce47db5b-7d7b-4e33-a1e9-1df769c80114  |  Id of chat message was sent in |
| CreatedTime  | TIMESTAMP  | 1643559781938  | Timestamp when it was created  |
| UpdatedTime  | TIMESTAMP  | 1643559781938  | Timestamp when it was edited  |
  

## ChatRoom  Table

| Column name | Type | Example  | Description  |
|---|---|---|---|
| ID | VARCHAR(36) |  ce47db5b-7d7b-4e33-a1e9-1df769c80112 |  Id of chat room resource |
| Sentiment | FLOAT | 30 | Sentiment score for last 5 minutes worth of messages |
| CreatedTime  | TIMESTAMP  | 1643559781938  | Timestamp when it was created  |
| UpdatedTime  | TIMESTAMP  | 1643559781938  | Timestamp when it was edited  |

## UserChat Table

This table is for knowing which users are in a chat

| Column name | Type | Example  | Description  |
|---|---|---|---|
| ChatRoomID | VARCHAR(36) |  ce47db5b-7d7b-4e33-a1e9-1df769c80112 |  Id of chat room resource |
| UserID  | VARCHAR(36)   | ce47db5b-7d7b-4e33-a1e9-1df769c80112  | Id of user room resource  |
| UpdatedTime  | TIMESTAMP  | 1643559781938  | Timestamp when it was edited  |


# Redis stateful set
  Contains in memory chat state
  - Chat
  - Users in chat
  - Sentiment (aggregation on last 5 minutes worth of messages)
  - Sentiment sequence (30 minutes sentiment aggregation with 1 minute frequency)
  - last 20 messages (for quick chat load time)   

Example:

```
{    
  id: "ce47db5b-7d7b-4e33-a1e9-1df769c80112",    
  users: [{id, username}],    
  sentiment: 34,    
  sentimentSequence: [{id, value, timestamp}, ..., {id, value, timestamp}]    
  messages: [{message, id, userId, createdTime, updatedTime}]    
}
```

# Inference pod 
  This is a service  where we run either a home built instance of a sentiment analysis model or we use a AWS service something like **AWS Comprehend** that supports sentiment analysis.

  This service consumes messages from kafka topic and feeds them to either: 
  - the model (depending on which solution we go for the process will more complex, having tokenization, pre-processing, and additional steps that we do before feeding the data)
  - AWS comprehend through **AWS SDK**  that takes the following object:  https://docs.aws.amazon.com/comprehend/latest/dg/get-started-api-sentiment.html
    For detect sentiment
    ```
    {
      "LanguageCode": "string",
      "Text": "string"
    }
    ```
    and returns the following syntax
    ```
    {
      "Sentiment": "string",
      "SentimentScore": { 
          "Mixed": number,
          "Negative": number,
          "Neutral": number,
          "Positive": number
      }
    }
    ```
    This service also supports BatchDetectSentiment which allows you to get sentiment for a batch of messages and StartSentimentDetectionJob (This options requires more investigation)
    
    After detecting the sentiment through any of these options results are then processed to be one of these values 1, -1, 0 (which is the closest)
    These results are set in the message object and then published to kafka topic to be consumed by the services that need this information.
    ```
      {
        id: "string",
        message: "string",
        chatRoomId: "string",
        userId: "string",
        createdTime: "number",
        updatedTime: "number"
        sentiment: "number" // -1, 1, 0 
      }
    ``` 
    Resulting objects can be saved in Postgres.
# Message Aggregator

  Is a Node.js based service that consumes messages sent from **Inference pod** and aggregates them in memory on a minute by minute basis. All messages that are recieved in a minute are aggregated in to  get the below object: 
  ```
  {
    id: "string",
    value: "number",
    chatRoomId: "number"
    timestamp: "number", // Timestamp of beginning of the minute that it calculated the values for
  }
  ```

  These objects are: 
  - saved in the Time series database, **TimescaleDB** in the MessageOneMinuteAggregate table that contains the below columns
  - published to Kafka topic to be consumed by interested parties (maybe subscription service if we would like to provide)
  - aggregations will be saved in **Redis** chat state replacing old aggregations (sentiment and sentiment sequence)

## TimescaleDB
This database is used for analytics, or dashboard queries (queries where we need to aggregate) if we need them and it has good performance on time series queries.

## MessageOneMinuteAggregate

| Column name | Type | Example  | Description  |
|---|---|---|---|
| ID | VARCHAR(36) |  ce47db5b-7d7b-4e33-a1e9-1df769c80112 |  Id of chat room resource |
| Value | FLOAT | 30 | Sentiment score for last minute worth of messages |
| ChatRoomID  | VARCHAR(36)  | ce47db5b-7d7b-4e33-a1e9-1df769c80112  | Timestamp when it was created  |
| Timestamp  | TIMESTAMP  | 1643559781938  | Timestamp when it was edited  |

This database could be later queried through a BI  tool like **Apache Superset** and joins between **Postgres** and **Timescale** or **MongoDB** could be achieved with tools like **Trino**