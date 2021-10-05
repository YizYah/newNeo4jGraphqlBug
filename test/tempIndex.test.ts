import test from 'ava';
import {ApolloServer, gql} from 'apollo-server';
import {Neo4jGraphQL} from '@neo4j/graphql';
import { mockDriver, mockSessionFromQuerySet, QuerySpec, wrapCopiedResults} from 'neo-forgery'


// GRAPHQL

const CREATE_BOOKS_MUTATION = `
mutation($createBooksInput: [BookCreateInput!]!) {
  createBooks(input: $createBooksInput) {
    books {
      title,
      author
    }
  }
}
`

const CREATE_BOOKS_PARAMS = {
    "createBooksInput": [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald"
        },
        {
            "title": "Beloved",
            "author": "Toni Morrison"
        }
    ]
}

const CREATE_BOOKS_OUTPUT = {
    "books": [
        {
            "title": "The Great Gatsby",
            "author": "F. Scott Fitzgerald"
        },
        {
            "title": "Beloved",
            "author": "Toni Morrison"
        }
    ]
}

// NEO4J QUERY
const createBooksNeo4jQuery = `
CALL {
CREATE (this0:Book)
SET this0.title = $this0_title
SET this0.author = $this0_author
RETURN this0
}
CALL {
CREATE (this1:Book)
SET this1.title = $this1_title
SET this1.author = $this1_author
RETURN this1
}



RETURN 
this0 { .title, .author } AS this0, 
this1 { .title, .author } AS this1
`
const createBooksNeo4jParams = {
    "this0_title": "The Great Gatsby",
    "this0_author": "F. Scott Fitzgerald",
    "this1_title": "Beloved",
    "this1_author": "Toni Morrison"
}
const createBooksNeo4jOutput = wrapCopiedResults([
    {
        "keys": [
            "this0",
            "this1"
        ],
        "length": 2,
        "_fields": [
            {
                "title": "The Great Gatsby",
                "author": "F. Scott Fitzgerald"
            },
            {
                "title": "Beloved",
                "author": "Toni Morrison"
            }
        ],
        "_fieldLookup": {
            "this0": 0,
            "this1": 1
        }
    }
])

const createBooksQuery = {
    name: 'createBooks',
    query: createBooksNeo4jQuery,
    params: createBooksNeo4jParams,
    output: createBooksNeo4jOutput,
}

const querySet: QuerySpec[] = [ createBooksQuery ]


// SERVER

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }
`;
const schema = new Neo4jGraphQL({
    typeDefs,
}).schema;

export function newServer(context: any):ApolloServer {
    const server: ApolloServer = new ApolloServer(
        {
            schema,
            context,
        });
    return server;
}


const session = mockSessionFromQuerySet(querySet)
const driver = mockDriver(session)

export function context({event, context}: { event: any, context: any }): any {

    return ({
        event,
        context,
        driver,
    });
}


const server: ApolloServer = newServer(context)


// TEST
test('createBooks', async (t: any) => {

    let result: any
    result = await server.executeOperation({
        query: CREATE_BOOKS_MUTATION,
        variables: CREATE_BOOKS_PARAMS,
    });

    console.log(`result.errors = ${JSON.stringify(result.errors)}`)
    t.true(result.errors === undefined);

    // t.deepEqual(
    //     // @ts-ignore
    //     result.data.createBooks,
    //     CREATE_BOOKS_OUTPUT
    // );
});
