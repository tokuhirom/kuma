#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use 5.010000;
use autodie;
use JSON;

my @tokens = qw(
    TOKEN_IDENT
    TOKEN_DOUBLE
    TOKEN_INTEGER
    TOKEN_STRING

    TOKEN_CLASS
    TOKEN_RETURN
    TOKEN_USE
    TOKEN_UNLESS
    TOKEN_IF
    TOKEN_DO
    TOKEN_SUB
    TOKEN_STR_NOT
    TOKEN_DIE
    TOKEN_TRY
    TOKEN_STR_OR
    TOKEN_STR_XOR
    TOKEN_STR_AND
    TOKEN_ELSIF
    TOKEN_LAST
    TOKEN_NEXT
    TOKEN_ELSE
    TOKEN_WHILE
    TOKEN_FOR
    TOKEN_MY
    TOKEN_UNDEF
    TOKEN_TRUE
    TOKEN_FALSE
    TOKEN_SELF
    TOKEN_FILE
    TOKEN_LINE
    TOKEN_IS

    TOKEN_QUESTION
    TOKEN_PLUSPLUS
    TOKEN_PLUS_ASSIGN
    TOKEN_PLUS
    TOKEN_BYTES_DQ
    TOKEN_BYTES_SQ
    TOKEN_LPAREN
    TOKEN_HEREDOC_SQ_START
    TOKEN_DIV_ASSIGN
    TOKEN_DIV
    TOKEN_MOD_ASSIGN
    TOKEN_MOD
    TOKEN_COMMA
    TOKEN_NOT_EQUAL
    TOKEN_REGEXP_NOT_MATCH
    TOKEN_NOT
    TOKEN_EQUAL_EQUAL
    TOKEN_FAT_COMMA
    TOKEN_REGEXP_MATCH
    TOKEN_ASSIGN
    TOKEN_XOR_ASSIGN
    TOKEN_XOR
    TOKEN_DOTDOTDOT
    TOKEN_DOTDOT
    TOKEN_DOT
    TOKEN_OROR_ASSIGN
    TOKEN_OROR
    TOKEN_OR_ASSIGN
    TOKEN_OR
    TOKEN_ANDAND
    TOKEN_AND_ASSIGN
    TOKEN_AND
    TOKEN_LSHIFT_ASSIGN
    TOKEN_HEREDOC_SQ_START
    TOKEN_LSHIFT
    TOKEN_CMP
    TOKEN_LE
    TOKEN_LT
    TOKEN_RSHIFT_ASSIGN
    TOKEN_RSHIFT
    TOKEN_GE
    TOKEN_GT
    TOKEN_REF
    TOKEN_TILDE
    TOKEN_DEREF
    TOKEN_POW_ASSIGN
    TOKEN_POW
    TOKEN_MUL_ASSIGN
    TOKEN_MUL
    TOKEN_PLUSPLUS
    TOKEN_PLUS_ASSIGN
    TOKEN_PLUS
    TOKEN_LBRACE
    TOKEN_BYTES_SQ
    TOKEN_BYTES_DQ
    TOKEN_QW
    TOKEN_STRING_DQ
    TOKEN_STRING_SQ
    TOKEN_LBRACKET
    TOKEN_FILETEST
    TOKEN_MINUSMINUS
    TOKEN_LAMBDA
    TOKEN_MINUS_ASSIGN
    TOKEN_MINUS
    TOKEN_RPAREN
    TOKEN_COLON
    TOKEN_END
    TOKEN_SEMICOLON
    TOKEN_RBRACE
    TOKEN_RBRACKET
    TOKEN_REGEXP
    TOKEN_LF
    TOKEN_NEW
    TOKEN_STATIC
);
my $i = 1;
my %tokens = map { $_ => $i++ } @tokens;
$tokens{'TOKEN_EOF'} = -1;
print 'module.exports=' . encode_json({
    name2id => \%tokens,
    id2name => +{ reverse %tokens },
}) . ';';

