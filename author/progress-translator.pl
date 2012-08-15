use strict;
use warnings;
use utf8;
use autodie;
use Getopt::Long;

GetOptions(
    'v|verbose' => \my $verbose,
);

my @tokens = get_tokens();
my $remains = 0+check_tokens(@tokens);
printf("----\n");
printf("%s", `date +%Y-%m-%dT%H:%M:%S`);
printf("Parser: %d\n", `grep TODO src/parser.js | wc -l`);
printf("TRANSLATOR: total: %d, remains: %d(%.2f%%)\n", 0+@tokens, $remains, 100.0*($remains/@tokens));
system("wc -l src/*.js");

if ($verbose) {
    print join(" ", check_tokens(@tokens)), "\n";
}

sub check_tokens {
	my %tokens = map { $_ => 1 } @_;
	open my $fh, '<', 'src/translator.js';
	my $src = do { local $/; <$fh> };
		$src =~ s/(NODE_\w+)/
		delete $tokens{$1};
		"";
	/ge;
	return keys %tokens;
}

sub get_tokens {
	open my $fh, '<', 'src/parser.js';
	my $src = do { local $/; <$fh> };
	my %foo;
	$src =~ s/(NODE_\w+)/
		$foo{$1}++
	/ge;
	return keys %foo;
}
