#!/usr/bin/perl

my $response = "U2FsdGVkX196KmJ2k+hXxwCIMZ3QaYt0GIlUiLYk52XM6UALUGgmlt0G+28ScebCD0mLjGAoMCWqhPz2cgToPw==";
my $expected = "robertssheri-aeb5b374744f42fa85d811c0c1ce5be3";

# my $i = 0;

while (my $line = <>) {
    chomp $line;
    my $command = 'bash -c \'openssl enc -d -base64 -aes-128-cbc -md sha256 -pass pass:"' . $line . '" <<< "' . $response . '" 2>/dev/null\'';
    my $data = `$command`;

    if ($data eq $expected) {
        print "$line\n";
        exit;
    }
}
