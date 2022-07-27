package main

import (
	"strings"

	"github.com/fluidity-money/fluidity-app/lib/log"
	"github.com/fluidity-money/fluidity-app/lib/queue"
	"github.com/fluidity-money/fluidity-app/lib/queues/worker"
	"github.com/fluidity-money/fluidity-app/lib/util"
	solanaRpc "github.com/gagliardetto/solana-go/rpc"
)

const (
	// EnvSolanaRpcUrl is the url used to make Solana HTTP RPC requests
	EnvSolanaRpcUrl = `FLU_SOLANA_RPC_URL`

	// EnvSolanaTokenLookups is the map of fluid -> base tokens
	EnvSolanaTokenLookups = `FLU_SOLANA_TOKEN_LOOKUPS`

	// EnvSaberSwapProgramid is the program ID of the saber swap program (not router)
	EnvSaberSwapProgramId = `FLU_SOLANA_SABER_SWAP_PROGRAM_ID`

	// EnvSaberRpcUrl to use when making lookups to their infrastructure
	EnvSaberRpcUrl = `FLU_SOLANA_SABER_RPC_URL`

	// EnvOrcaProgramId is the program ID of the orca swap program
	EnvOrcaProgramId = `FLU_SOLANA_ORCA_PROGRAM_ID`

	// EnvRaydiumProgramId is the program ID of the Raydium swap program
	EnvRaydiumProgramId = `FLU_SOLANA_RAYDIUM_PROGRAM_ID`
)

func tokenListFromEnv(env string) map[string]string {
	tokenListString := util.GetEnvOrFatal(env)

	tokensMap := make(map[string]string)

	tokens := strings.Split(tokenListString, ",")

	for _, token := range tokens {
		tokenDetails := strings.Split(token, ":")

		if len(tokenDetails) != 2 {
			log.Fatal(func(k *log.Log) {
				k.Format(
					"Unexpected token details format! Expected fluid:base, got %s",
					token,
				)
			})
		}

		var (
			fluid = tokenDetails[0]
			base  = tokenDetails[1]
		)

		tokensMap[fluid] = base
	}

	return tokensMap
}

func main() {
	var (
		solanaRpcUrl       = util.GetEnvOrFatal(EnvSolanaRpcUrl)
		fluidTokens        = tokenListFromEnv(EnvSolanaTokenLookups)
		saberRpcUrl        = util.GetEnvOrFatal(EnvSaberRpcUrl)
		saberSwapProgramId = util.GetEnvOrFatal(EnvSaberSwapProgramId)
		orcaProgramId      = util.GetEnvOrFatal(EnvOrcaProgramId)
		raydiumProgramId   = util.GetEnvOrFatal(EnvRaydiumProgramId)
	)

	solanaClient := solanaRpc.New(solanaRpcUrl)

	worker.GetSolanaBufferedParsedTransactions(func(transactions worker.SolanaBufferedParsedTransactions) {
		transfers := make([]worker.SolanaDecoratedTransfer, 0)

		for transactionNumber, transaction := range transactions.Transactions {
			var (
				transactionApp       = transaction.Transaction.Application
				transactionSignature = transaction.Transaction.Signature
			)

			decorated, err := parseTransaction(
				solanaClient,
				fluidTokens,
				transaction,
				saberRpcUrl,
				saberSwapProgramId,
				orcaProgramId,
				raydiumProgramId,
			)

			if err != nil {
				log.Fatal(func(k *log.Log) {
					k.Format(
						"Failed to parse an application at transaction %v! %v",
						transactionNumber,
						err,
					)
				})
			}

			if decorated == nil {
				log.App(func(k *log.Log) {
					k.Format(
						"Application didn't return a transfer, app index %d, transaction %s",
						transactionApp,
						transactionSignature,
					)
				})

				continue
			}

			transfers = append(transfers, decorated...)
		}

		bufferedTransfers := worker.SolanaBufferedTransfers{
			Transfers: transfers,
		}

		queue.SendMessage(
			worker.TopicSolanaBufferedTransfers,
			bufferedTransfers,
		)
	})
}