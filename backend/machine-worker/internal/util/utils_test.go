package util

import (
	"testing"
)

func TestHash(t *testing.T) {
	type args struct {
		x string
	}
	tests := []struct {
		name string
		args args
		want string
	}{
		{
			name: "kek1",
			args: args{x: "asd"},
			want: "617364811c9dc5",
		},
		{
			name: "kek2",
			args: args{x: "fdsaga"},
			want: "666473616761811c9dc5",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			t.Parallel()
			if got := Hash(tt.args.x); got != tt.want {
				t.Errorf("Hash() = %v, want %v", got, tt.want)
			}
		})
	}
}
