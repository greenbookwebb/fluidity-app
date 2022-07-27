package spl_token

import (
	"github.com/fluidity-money/fluidity-app/lib/log"

	solLib "github.com/gagliardetto/solana-go"
)

func init() {
	var err error

	TokenProgramAddressPubkey, err = solLib.PublicKeyFromBase58(
		TokenProgramAddress,
	)

	if err != nil {
		log.Fatal(func(k *log.Log) {
			k.Format(
				"Failed to decode token address pubkey %#v",
				TokenProgramAddress,
			)
		})
	}

	TokenAssociatedProgramAddressPubkey, err = solLib.PublicKeyFromBase58(
		TokenAssociatedProgramAddress,
	)

	if err != nil {
		log.Fatal(func(k *log.Log) {
			k.Format(
				"Failed to decode associated token address pubkey %#v",
				TokenAssociatedProgramAddress,
			)
		})
	}
}