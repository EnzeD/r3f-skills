#!/bin/sh
# Copy eval outputs out of a bare sandbox into the workspace for grading.
#   sh evals/collect-sandbox.sh <sandbox-dir> <workspace-iteration-dir>
SB="$1"; WS="$2"
for i in 0 1 2; do
  for cfg in with_skill without_skill; do
    mkdir -p "$WS/eval-$i/$cfg/outputs"
    for f in Solution.tsx ANSWER.md; do
      [ -f "$SB/eval-$i/$cfg/$f" ] && cp "$SB/eval-$i/$cfg/$f" "$WS/eval-$i/$cfg/outputs/$f"
    done
  done
done
echo "collected:"
find "$WS" -name 'Solution.tsx' -o -name 'ANSWER.md' | sort
