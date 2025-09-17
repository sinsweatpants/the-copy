{ pkgs }:
{
  channel = "stable-24.05";

  packages = with pkgs; [
    nodejs_20
    postgresql
    inetutils
    toybox
    uutils-coreutils-noprefix
  ];

  idx.extensions = [
    "svelte.svelte-vscode"
    "vue.volar"
  ];
}
