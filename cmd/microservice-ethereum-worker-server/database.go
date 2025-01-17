// Copyright 2022 Fluidity Money. All rights reserved. Use of this
// source code is governed by a GPL-style license that can be found in the
// LICENSE.md file.

package main

import (
	timescale "github.com/fluidity-money/fluidity-app/lib/databases/timescale/worker"
	"github.com/fluidity-money/fluidity-app/lib/log"
	"github.com/fluidity-money/fluidity-app/lib/types/network"
	"github.com/fluidity-money/fluidity-app/lib/types/ethereum"
	postgres "github.com/fluidity-money/fluidity-app/lib/databases/postgres/worker"
)

func addAndComputeAverageAtx(network_ network.BlockchainNetwork, blockNumber uint64, tokenShortName string, transfers, limit int) (int, []uint64, []int) {
	log.Debug(func (k *log.Log) {
		k.Message = "About to insert a transaction count into timescale!"
	})

	timescale.InsertTransactionCount(
		blockNumber,
		tokenShortName,
		transfers,
		network_,
	)

	log.Debug(func (k *log.Log) {
		k.Message = "About to get average atx from timescale!"
	})

	return timescale.GetAverageAtx(
		tokenShortName,
		network_,
		limit,
	)
}

func lookupFeeSwitch(addr ethereum.Address, network_ network.BlockchainNetwork) ethereum.Address {
	feeSwitch := postgres.GetFeeSwitch(addr, network_)

	if feeSwitch == nil {
		return addr
	}

	return feeSwitch.NewAddress
}
