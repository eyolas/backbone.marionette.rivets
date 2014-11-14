# Rivets.factory
# --------------

# Rivets.js module factory.
Rivets.factory = (sightglass) ->
  # Integrate sightglass.
  Rivets.sightglass = sightglass

  # Allow access to private members (for testing).
  Rivets.public._ = Rivets

  # Return the public interface.
  Rivets.public


rivets = Rivets.factory sightglass