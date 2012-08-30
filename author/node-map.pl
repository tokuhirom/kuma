#!/usr/bin/env perl
use strict;
use warnings;
use utf8;
use 5.010000;
use autodie;
use JSON;

my @nodes = qw(
    NODE_FUNCALL
    NODE_IDENT
    NODE_BUILTIN_FUNCALL
    NODE_STRING
    NODE_PRE_INC
    NODE_POST_INC
    NODE_PRE_DEC
    NODE_POST_DEC
    NODE_POW
    NODE_INTEGER
    NODE_UNARY_NOT
    NODE_UNARY_TILDE
    NODE_UNARY_REF
    NODE_UNARY_PLUS
    NODE_UNARY_MINUS
    NODE_UNARY_MUL
    NODE_TRUE
    NODE_FALSE
    NODE_MUL
    NODE_DIV
    NODE_MOD
    NODE_ADD
    NODE_SUBTRACT
    NODE_LSHIFT
    NODE_RSHIFT
    NODE_GT
    NODE_GE
    NODE_LT
    NODE_LE
    NODE_EQ
    NODE_NE
    NODE_CMP
    NODE_RANGE
    NODE_DOTDOTDOT
    NODE_LOGICAL_OR
    NODE_LOGICAL_AND
    NODE_BITOR
    NODE_BITXOR
    NODE_BITAND
    NODE_THREE
    NODE_COMMA
    NODE_UNARY_NOT
    NODE_LOGICAL_XOR
    NODE_NOP
    NODE_BLOCK
    NODE_RETURN
    NODE_LAST
    NODE_NEXT
    NODE_SUB
    NODE_TRY
    NODE_THROW
    NODE_STMTS
    NODE_UNDEF
    NODE_IF
    NODE_ELSIF
    NODE_ELSE
    NODE_ASSIGN
    NODE_MUL_ASSIGN
    NODE_PLUS_ASSIGN
    NODE_DIV_ASSIGN
    NODE_MOD_ASSIGN
    NODE_MINUS_ASSIGN
    NODE_LSHIFT_ASSIGN
    NODE_RSHIFT_ASSIGN
    NODE_POW_ASSIGN
    NODE_AND_ASSIGN
    NODE_OR_ASSIGN
    NODE_XOR_ASSIGN
    NODE_OROR_ASSIGN
    NODE_MY
    NODE_WHILE
    NODE_MAKE_ARRAY
    NODE_MAKE_HASH
    NODE_GET_METHOD
    NODE_METHOD_CALL
    NODE_LAMBDA
    NODE_FOREACH
    NODE_DO
    NODE_CLASS
    NODE_REGEXP
    NODE_FOR
    NODE_REGEXP_MATCH
    NODE_REGEXP_NOT_MATCH
    NODE_ITEM
    NODE_USE
    NODE_NEW
    NODE_SELF
    NODE_LABELED
    NODE_DIE
    NODE_STATIC
    NODE_FILETEST
    NODE_QX
    NODE_EXPORT
);
my $i = 1;
my %nodes = map { $_ => $i++ } @nodes;
print 'module.exports=' . encode_json({
    name2id => \%nodes,
    id2name => +{ reverse %nodes },
}) . ';';

