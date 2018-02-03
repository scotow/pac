#!/usr/bin/perl

my $response = "U2FsdGVkX1/uKsnwkUKb6qDJtsJD3lXdYCpKug2y7A081mcwcXvn1b2PiKfoVcTpjcIXs4kk067DtxS5Dl4nUw==";
my $expected = "shawncarrillo-81d6473d7c854391a3325b17120edf4e";

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
