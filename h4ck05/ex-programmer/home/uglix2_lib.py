import curses
import json

from django.shortcuts import render

# encodage compact des attributs
COLORS = {'BLACK': 0, 'WHITE': 7+8, 'BLUE': 4+8, 'GREEN': 2+8, 'RED': 1+8, 'CYAN': 6+8, 'YELLOW': 3+8, 'MAGENTA': 5+8,
          'DARKWHITE': 7, 'DARKBLUE': 4, 'DARKGREEN': 2, 'DARKRED': 1, 'DARKCYAN': 6, 'DARKYELLOW':3, 'DARKMAGENTA': 5}
ATTRIBUTES = {'BOLD': 1 << 4, 'UNDERLINE': 1 << 5, 'REVERSE': 1 << 6, 'DIM': 1 << 7}

class Format:
    def __init__(self, *args):
        self.color = None
        self.attr = 0
        if args:
            if len(args) > 1:
                raise ValueError("un seul argument")
            arg = args[0]
            if arg in COLORS:
                self.color = arg
            elif arg in ATTRIBUTES:
                self.attr = ATTRIBUTES[arg]
            else:
                raise ValueError("unknown arg {0}".format(arg))

    def __or__(self, other):
        #if self.color is not None and other.color is not None:
        #    raise ValueError("combinaison bicolore")
        result = Format()
        if self.color:
            result.color = self.color
        if other.color:
            result.color = other.color
        # la couleur du 2ème gagne
        result.attr = self.attr | other.attr
        return result

    def __repr__(self):
        x = []
        if self.color:
            x.append(self.color)
        for item in ATTRIBUTES:
            if self.attr & ATTRIBUTES[item]:
                x.append(item)
        return "Format({0})".format(x)


    def encode(self):
        if not self.color:                  # blanc par défaut
            return COLORS['WHITE'] + self.attr
        return COLORS[self.color] + self.attr


def format_decode(n):
    color = n & 0x000f
    offset = 1
    curses_format = 0
    for item in ATTRIBUTES:
        if n & ATTRIBUTES[item]:
            curses_format |= getattr(curses, 'A_' + item)
    # hack crade
    curses_format ^= curses.color_pair(offset + color)
    return curses_format

    

class Clear:
    pass

class Move:
    def __init__(self, y, x):
        self.y = y
        self.x = x

class Write:
    def __init__(self, text, format=Format()):
        self.format = format
        self.text = text

class Field:
    def __init__(self, id, length, active=False, protected=True):
        self.id = id
        self.active = active
        self.length = length
        self.protected = protected


# python ne sait pas sérialiser nos petits trucs en JSON, donc on hacke
class StatementEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Clear):
            return 'C'
        elif isinstance(obj, Move):
            return ('M', obj.y, obj.x)
        elif isinstance(obj, Write):
            return ('W', obj.text, obj.format.encode())
        elif isinstance(obj, Field):
            return ('F', obj.id, obj.length, obj.active, obj.protected)
        #Let the base class default method raise the TypeError
        return json.JSONEncoder.default(self, obj)

def statement_deserialize(o):
    """
    >>> m = Move(30, 40)
    >>> j = json.dumps(m, cls=StatementEncoder)
    >>> mm = json.loads(j, object_hook=statement_deserialize)
    >>> mm
    Move(30, 40)
    """
    if o == 'C':
        return Clear()
    t = o[0]
    if t == 'M':
        return Move(o[1], o[2])
    if t == 'W':
        return Write(o[1], o[2])
    if t == 'F':
        return Field(o[1], o[2], o[3], o[4])
    return o
