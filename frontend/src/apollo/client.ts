import { ApolloClient, InMemoryCache, createHttpLink } from "@apollo/client";

// Create HTTP link with dynamic URL from environment
const httpLink = createHttpLink({
  uri: import.meta.env.VITE_GRAPHQL_URL,
});

// Create Apollo Client instance
export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      errorPolicy: "all",
    },
    query: {
      errorPolicy: "all",
    },
  },
});
