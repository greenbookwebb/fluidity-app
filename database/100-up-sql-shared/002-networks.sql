-- migrate:up

-- add the current blobkchain backends that we support, ethereum and solana

CREATE TYPE network_blockchain AS ENUM (
	'ethereum',
	'solana'
);

-- migrate:down

DROP TYPE IF EXISTS network_blockchain;
