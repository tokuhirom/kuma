#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use 5.010000;
use autodie;

open my $fh, '<', 'src/parser.js';
my $src = do { local $/; <$fh>; };
$src =~ s!/\*.+\*/!!gsm;
my %map;
while ($src =~ /(NODE_\w+)/g) {
    $map{$1}++;
}
while ($src =~ /(NODE_\w+)\s*=\s*/g) {
    delete $map{$1};
}
say join("\n", keys %map);
