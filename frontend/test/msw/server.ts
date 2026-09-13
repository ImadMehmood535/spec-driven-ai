import { setupServer } from 'msw/node';

/**
 * The API is mocked at the network boundary, never by stubbing modules — so
 * the component under test runs its real hooks and its real API client
 * (testing standards).
 */
export const server = setupServer();
