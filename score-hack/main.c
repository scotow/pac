#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>

#include "generate.h"
#include "verify.h"

#define TOTAL_POSIBILITIES 177147

void test_word(char *key) {
    if(verify(key)) {
        printf("%s\n", key);
        exit(EXIT_SUCCESS);
    }
}

void force(long int proc_count, unsigned int index, struct god_s *god) {
    char key[32];
    size_t i;

    init_next(god, TOTAL_POSIBILITIES / proc_count * index);

    for (i = 0; i < TOTAL_POSIBILITIES / proc_count; i++) {
        next(god, key);
        test_word(key);
    }
    if(index == proc_count - 1) {
        for (i = 0; i < TOTAL_POSIBILITIES % proc_count; i++) {
            next(god, key);
            test_word(key);
        }
    }
}

int main(int argc, char const *argv[]) {
    const long int proc_count = sysconf(_SC_NPROCESSORS_ONLN);
    // const long int proc_count = 1;

    pid_t process_ids[proc_count];
    size_t proc_index;

    pid_t process_id;
    unsigned int process_status;

    // Init generation.
    char *sureE = "e";          // 0
    char *sure6 = "6";          // 1

    char *uniq1 = "1";          // 2
    char *uniq2 = "2";          // 3
    char *uniq4 = "4";          // 4
    char *uniq7 = "7";          // 5
    char *uniqF = "f";          // 6

    char *set0 = "086";         // 7
    char *set1 = "359";         // 8
    char *set2 = "abd";         // 9
    char *set3 = "ce";          // 10

    char *big1 = "086359"       // 11
    char *big2 = "086abd"       // 12
    char *big3 = "359abd"       // 13
    char *big4 = "086359abd"    // 14

    e 6   f                        1                      4         1       7
    0 1 9 6 7 12 14 7 7 7 10 10 12 2 8 8 12 12 12 12 13 9 4 8 10 13 2 7 8 8 5 8

    ^       ^           ^            ^            ^           ^           ^   ^
    1       5           10           15           20          25          30  32

    char **c = malloc(13 * sizeof(char *));
    c[0] = c0; c[1] = c1; c[2] = c2; c[3] = c3; c[4] = c4; c[5] = c5; c[6] = c6; c[7] = c7; c[8] = c8; c[9] = c9; c[10] = c10; c[11] = c11; c[12] = c12;

    int pattern[] = {2, 1, 3, 3, 4, 12, 7, 4, 5, 3, 1};

    struct god_s *god = generate(pattern, 32, c, 11);


    for (proc_index = 0; proc_index < proc_count; proc_index++) {
        if ((process_ids[proc_index] = fork()) == 0) {
            force(proc_count, proc_index, god);
            exit(EXIT_FAILURE);
        }
    }

    for (proc_index = 0; proc_index < proc_count; proc_index++) {
        process_id = waitpid(-1, &process_status, 0);

        if (process_status == 0) {
            size_t i;
            for (i = 0; i < proc_count; i++) {
                if(process_id == process_ids[i]) {
                    continue;
                }

                kill(process_ids[i], SIGKILL);
            }
            exit(EXIT_SUCCESS);
        }
    }

    exit(EXIT_FAILURE);
}