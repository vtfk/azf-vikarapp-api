# VikarApp API
This is the API for **VikarApp** a application developed by VTFK.

VikarApp makes it simple for teachers to substitute for other teachers school teams.

## How VikarApp Works
1. A teacher that want to substitute for another teacher logs into the web app
2. The substitute search for the teacher they want to substitute for
3. The substitute chooses what teams/classes they want to substitute for
4. The API adds the substitute as a owner for the Teams they selected
5. After two days has passed the owership is automatically removed if the substitution is not extended

## How to setup VikarApp
### Prerequisites
1. Microsoft Azure Subscription
1. Microsoft Office 365 Tenant with teams
1. [Microsoft School Data Sync](https://sds.microsoft.com/)
1. MongoDB database
1. (Optional) Visma InSchool
### Steps
1. Create a App registration in Azure AD
    1. Add delegated permissions:
        * User.Read.All
        * User.ReadBasic.All
    1. Add application permissions:
        * User.Read.All
        * Member.Read.Hidden
        * Group.ReadWrite.All
        * GroupMember.ReadWrite.All
    1. Add the following App roles with the desired members
        * Users (App.User) - All users of the application, gives basic usage rights
        * Configuration (App.Config) - Gives permissions to edit school permissions
        * Admins (App.Admin) - Gives permissions to see all history, logs and managing school permissions
    1. Add the redirect urls that you will deploy **VikarAppWeb** to
        *  https://[your-url]/
        *  https://[your-url]/login
        *  https://[your-url]/handlelogin
    1. Generate a Client Secret and keep it somewhere safe
    1. Add the following custom claims
        * company
        * department
        * [Guide for doing this](https://docs.microsoft.com/en-us/azure/active-directory/develop/active-directory-claims-mapping#include-the-employeeid-and-tenantcountry-as-claims-in-tokens)
1. Create a MongoDB database with a user with read/write access
    * We use MongoDB Atlas, but any instance of MongoDB should work
    * The API will configure all collections automatically
1. Create a group for all users of the application
    * Make note of the groupId
    * Add all teachers to this group
1. Deploy the API
    * Create an Azure Function App for running the API
    * The Azure Function App should be created with Application Insights and a StorageAccouns
    * Deploy this GitHub repository to that Azure Function App
1. Deploy the WebApp
    * See the [GitHub repository](https://github.com/vtfk/vikarapp-web) for deployment information

### (Optional)
1. If wou want to limit what schools can search for each other
    * Make sure that the company attribute is set appropriatly for all teachers
1. If you want to check if the substitute has become a teacher for the team after substituting and should not be removed (Works only for Visma in-school)
    1. Create a MongoDB database for the SDS (School data sync) information
    2. Create a script that regularly dumps the SDS data to the database
    3. Setup the **SDS_MONGODB_CONNECTIONSTRING** environment variable

## Environment Variables

|Environment variable|Description|Example|
|---|---|---|
USE_MOCK | Should MOCK data be used? | true
AZURE_APP_TENANT_ID | The guid of the Microsoft tenant | [GUID]
AZURE_APP_ID | The client id / guid of the Azure app registration | [GUID]
AZURE_APP_SECRET | The secret of the app registration | String
AZURE_APP_SCOPE | The scopes that the app registration should get | https://graph.microsoft.com/.default
AZURE_APP_GRANT_TYPE | Specifies the grant type between the application and Azure | client_credentials
AZURE_SEARCH_GROUP_ID | The AAD group to search for teachers / substitutes in | [GUID]
MONGODB_CONNECTIONSTRING | Connection string to the MongoDB database | [MongoDB connection string]
APP_DEACTIVATE_TIMERS | Should the timers for (de)activations run? | false
(Optional) SDS_MONGODB_CONNECTIONSTRING | Connection string to the School-data-sync database | [MongoDB connection string]


## Development
### Prerequisites
1. Clone this repository
1. Install [Node.js v.14](https://nodejs.org/en/)
1. Install [Azure Function Core Tools](https://docs.microsoft.com/en-us/azure/azure-functions/functions-run-local?tabs=v4%2Cwindows%2Ccsharp%2Cportal%2Cbash)
1. Run **npm i** to install all packages

### Start development environment

2. Create a **.env.development** file and add all environment variables in [Key]=[Value] format
2. Run **npm run dev** to start the development environment

### Testing
1. Run **npm run test** to start the code tests