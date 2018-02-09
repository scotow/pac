import base64
import random

class Block(bytearray):
    """
    Une classe qui permet de gérer des blocs de données.

    Voir la doc des méthodes ci-dessous pour le détail des opérations
    possibles. Voici ce qui est hérité de bytearray():

    Convertion en bytes():
    >>> b = Block('6a2db7f01ac43715408870c07b15adc5')
    >>> bytes(b)
    b'j-\\xb7\\xf0\\x1a\\xc47\\x15@\\x88p\\xc0{\\x15\\xad\\xc5'

    Taille du bloc en octets :
    >>> len(Block())
    16

    Accès au i-ème octet d'un bloc (on récupère un entier):
    >>> b = Block('6a2db7f01ac43715408870c07b15adc5')
    >>> b[8]
    64
    >>> hex(b[8])
    '0x40'
    >>> type(b[8])
    <class 'int'>

    En cas d'erreur d'indice:
    >>> b[40]
    Traceback (most recent call last):
    ...
    IndexError: bytearray index out of range

    Les ruses habituelles de python fonctionnent. Accès au dernier élement:
    >>> hex(b[-1])
    '0xc5'

    """

    def __init__(self, block=None, n=16):
        """
        Création du bloc rempli de zéro:
        >>> b = Block()
        >>> print(b)
        00000000000000000000000000000000

        Création d'un bloc à partir d'une chaine hexadécimale:
        >>> b = Block('6a2db7f01ac43715408870c07b15adc5')
        >>> print(b)
        6A2DB7F01AC43715408870C07B15ADC5

        Création d'un bloc à partir de bytes():
        >>> Block(bytes(range(16)))
        Block('000102030405060708090A0B0C0D0E0F')

        Création d'un bloc à partir d'une liste ou d'un tuple:
        >>> Block([ i*i - i for i in range(1, 17)])
        Block('0002060C141E2A38485A6E849CB6D2F0')

        En cas d'erreur d'initialisation:
        >>> Block(3)
        Traceback (most recent call last):
        ...
        TypeError
        """
        if isinstance(block, int):
            raise TypeError
        if block is None:
            super().__init__([0] * n)
            return
        if isinstance(block, str):
            super().__init__(base64.b16decode(block, casefold=True))
        else:
            super().__init__(block)
        if len(self) != n:
                raise ValueError("wrong size : {0}".format(len(self)))


    def __xor__(self, other):
        """
        XOR de deux blocs :
        >>> a = Block([0x0f] * 16)
        >>> b = Block([0x18] * 16)
        >>> a ^ b
        Block('17171717171717171717171717171717')
        """
        result = Block()
        for i in range(len(self)):
            result[i] = self[i] ^ other[i]
        return result

    def __ixor__(self, other):
        """
        XOR "en place" (modifie le bloc courant sans en créer de nouveau):
        >>> a = Block([0x0f] * 16)
        >>> b = Block([0x18] * 16)
        >>> a ^= b
        >>> a
        Block('17171717171717171717171717171717')
        """
        for i in range(len(self)):
            self[i] ^= other[i]
        return self

    def hex(self):
        """
        Récupération du bloc en hexadécimal:
        >>> b = Block('6a2db7f01ac43715408870c07b15adc5')
        >>> b.hex()
        '6A2DB7F01AC43715408870C07B15ADC5'

        C'est aussi ce qui se passe si on essaye de convertir le bloc en str():
        >>> str(b)
        '6A2DB7F01AC43715408870C07B15ADC5'

        Ou si on essaye de l'afficher
        >>> print(b)
        6A2DB7F01AC43715408870C07B15ADC5
        """
        return base64.b16encode(self).decode('ascii')

    __str__ = hex
    def __repr__(self):
        """
        Affichage d'un bloc dans l'interpréteur python:
        >>> b = Block('6a2db7f01ac43715408870c07b15adc5')
        >>> b
        Block('6A2DB7F01AC43715408870C07B15ADC5')
        """
        return "Block('{0}')".format(self.hex())

    def unpad(self):
        """remove a (presumably correct) padding.

        >>> b = Block('08a2db7f01ac43715408870505050505')
        >>> b.unpad()
        b'\\x08\\xa2\\xdb\\x7f\\x01\\xacCqT\\x08\\x87'
        """
        return bytes(self)[:-self[-1]]

    @staticmethod
    def random(n=16):
        """
        Création d'un bloc aléatoire:
        >>> random.seed(1)
        >>> b = Block.random()
        >>> print(b)
        2291D8CDC310411E7EC27378A661C935
        """
        return Block(bytes([ random.getrandbits(8) for i in range(n) ]))

class Message(list):
    """
    Gestion de messages découpés en blocs.

    Création d'un message à partir d'une chaine hexadecimale:
    >>> hex_msg =  "087795db9b12231dedf223790c216753"
    >>> hex_msg += "1ce38e356f1898d646e613e33c4e0973"
    >>> hex_msg += "8acf5fcef091ca25d08153f24b7921fe"
    >>> hex_msg += "cd9baf9720292866b68e695b317a4902"
    >>> m = Message(hex_msg)
    >>> m                                      # doctest: +ELLIPSIS
    [Block('087795DB9B12231DEDF223790C216753'), Block('1CE38E356F1898D646E613E33C4E0973'), Block('8ACF5FCEF091CA25D08153F24B7921FE'), Block('CD9BAF9720292866B68E695B317A4902')]

    Nombre de blocs d'un message:
    >>> len(m)
    4

    Accès au i-ème bloc:
    >>> m[2]
    Block('8ACF5FCEF091CA25D08153F24B7921FE')

    On récupère de la sorte un objet de type Block:
    >>> isinstance(m[2], Block)
    True
    """
    def __init__(self, msg=None):
        if msg is None:
            super().__init__()
            return
        if isinstance(msg, str):
            super().__init__()
            for i in range(0, len(msg), 32):
                self.append(Block(msg[i:i+32]))
        if self == []:
            raise TypeError
