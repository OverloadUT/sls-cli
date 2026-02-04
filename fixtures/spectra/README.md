---
description: Spectra AI Network root
summary: |
  The root of the Spectra AI hierarchy containing all guilds,
  agents, and their associated workspaces. This is the anchor
  point for SPECTRA_WORKSPACE.
sls:schema:
  children:
    - name: guilds
      type: directory
      required: true
      description: Collection of AI agent guilds
---

# Spectra

The Spectra AI Network - a hierarchical system of guilds and agents.
