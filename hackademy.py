import random
import math

def pgcde(a, b):
    """ pgcd etendu avec les 2 coefficients de bezout u et v
        Entree : a, b entiers
        Sorties : r = pgcd(a,b) et u, v entiers tels que a*u + b*v = r
    """
    r, u, v = a, 1, 0
    rp, up, vp = b, 0, 1
    while rp != 0:
        q = r//rp
        rs, us, vs = r, u, v
        r, u, v = rp, up, vp
        rp, up, vp = (rs - q*rp), (us - q*up), (vs - q*vp)
    return (r, u, v)

def congruence_lineaire(a, b, n):
    """ Trouve la valeur de X pour une equation de la forme a*X+b == 0 mod n
        Entree : a, b, n entiers
        Sorties : X solution de l'equation
    """
    (g, c, h) = pgcde(a, n)
    return (c * (-b%n)) % n

def test_fermat(n):
    """ Determine si n est premier ou pas selon le test de primalite de test_fermat
    Version deterministe
    """
    for a in range(2,n-2):
        if pow(a, n-1, n) != 1:
            return False
    return True

def test_fermat_proba(n,k):
    """ Determine si n est premier ou pas selon le test de primalite de test_fermat
    Version probabiliste
    """
    for i in range(k):
        a = random.randint(2,n-2)
        if pow(a, n-1, n)!=1:
            return False
    return True

def prime_number(a,b):
    """Trouve le premier nombre premier compris dans l'intervalle [a,b[
    """
    for i in range(a, b):
        if test_fermat_proba(i,32):
            return i


def safe_prime(a,b):
    """Trouve un nombre premier sur compris dans [a,b[
    """
    while True:
        qs = 2*random.randint(a//24, b//24)+1
        while qs % 3 == 0 or qs % 5 == 0 or qs % 7 == 0 or qs % 11 == 0:
            qs = 2*random.randint(a//24, b//24)+1
        qp = 6*qs+3
        if test_fermat_proba(qp, 2):
            p = 12*qs + 7
            if test_fermat_proba(p, 2):
                return p
        qp = 6*qs + 5
        if test_fermat_proba(qp, 2):
            p = 12*qs + 11
            if test_fermat_proba(p, 2):
                return p

def prime_product(a,b):
    """Trouve une liste de nombre premier dont le produit est compris dans [a,b[
    """
    while True:
        minQp = b // 2**64
        maxQp = (b-a)//(3*b.bit_length())
        res = []
        qp = 1
        while qp < minQp:
            p = generate_prime()
            qp = qp * p
            res.append(p)
        if qp < maxQp:
            for i in range(a//qp, b//qp):
                if test_fermat_proba(i,2):
                    res.append(i)
                    return res

def generate_prime():
    """Génère un nombre premier aléatoire de compris entre 2^1 et 2^64
    """
    found_prime = False
    while not found_prime:
        p = random.randint(2, 2**64)
        if test_fermat_proba(p, 2):
            return p

def generate_big_prime(a):
    """Génère un nombre premier aléatoire de compris entre 2^a et 2^(a+1)
    """
    found_prime = False
    while not found_prime:
        p = random.randint(2**a, 2**(a+1))
        if test_fermat_proba(p, 2):
            return p


def root_prime(a,b):
    while True:
        res = []
        qp = generate_big_prime(383)
        print(qp.bit_length())
        res.append(qp)
        while qp < a:
            qp = qp * 2
            res.append(2)
        if qp < b:
            print("uol")
            if test_fermat_proba(sum(res)+1,2):
                return (res, sum(res)+1)
