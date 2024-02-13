package util

import (
	"encoding/hex"
	"hash/fnv"
	"math/rand"
)

func Hash(x string) string {
	hs := fnv.New32()
	return hex.EncodeToString(hs.Sum([]byte(x)))
}

const letters = "0123456789abcdef"

func RandomHash(n int) string {
	b := make([]byte, n)
	for i := range b {
		b[i] = letters[rand.Intn(len(letters))]
	}
	return string(b)
}
