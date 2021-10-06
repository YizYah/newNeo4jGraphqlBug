import test from 'ava';
import {ApolloServer, gql} from 'apollo-server';
import {Neo4jGraphQL} from '@neo4j/graphql';
import { mockDriver, mockSessionFromQuerySet, QuerySpec, wrapCopiedResults} from 'neo-forgery'

// GRAPHQL

export const DELETE_BOOKS_MUTATION = `
mutation ($bookWhere: BookWhere){
  deleteBooks(where: $bookWhere) {
      nodesDeleted
  }
}
`

export const DELETE_BOOKS_PARAMS = {
    "bookWhere": {
        "title": "Gatsby JS",
        "author": "F. Scott Fitzgerald"
    }
}

export const DELETE_BOOKS_OUTPUT = {
    "nodesDeleted": 1
}

// NEO4J QUERY

export const deleteBooksNeo4jQuery = `
MATCH (this:Book)
WHERE this.title = $this_title AND this.author = $this_author
DETACH DELETE this
`
export const deleteBooksNeo4jParams = {
    "this_title": "Gatsby JS",
    "this_author": "F. Scott Fitzgerald"
}
export const deleteBooksNeo4jOutput = wrapCopiedResults(
    [],
    {
        "updateStatistics": {
            "_stats": {
                "nodesDeleted": 1,
            },
        },
    }
)

export const deletionQueryInfo =     {
    name: 'deleteBooks',
    query: deleteBooksNeo4jQuery,
    params: deleteBooksNeo4jParams,
    output: deleteBooksNeo4jOutput,
}

const querySet: QuerySpec[] = [ deletionQueryInfo ]


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
test('deleteBooks', async (t: any) => {
    const result = await server.executeOperation({
        query: DELETE_BOOKS_MUTATION,
        variables: DELETE_BOOKS_PARAMS,
    });

    console.log(`result.errors = ${JSON.stringify(result.errors)}`)
    t.true(result.errors === undefined);
});
