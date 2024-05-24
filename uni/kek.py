
input = """
Несмотря на растущую популярность, для второго по популярности формата соревнований по информационной безопасности  – Attack-Defence CTF – нет способа тренировки, кроме непосредственного участия в соревнованиях. 

Despite the growing popularity of cybersecurty competitions, the second most popular format -- Attack-Defence CTF -- has no training solution, besides directly playing such competitions.


Также, многие аспекты игры в Attack-Defence (такие как: администрирование сервера, автоматизация эксплуатации уязвимостей) остаются барьером для начинающих участников.

Many aspects of playing Attack-Defence CTF (e.g. server administration, running exploits on all other participants) could be a barrier to entry for a lot of new participants.


Эта работа представляет новый способ тренировок вместе с системой для их проведения.

This paper introduces a new way to train for Attack-Defence CTF and a system for hosting such training. 


Такая тренировка не ограничена по времени, не требует серьезных вычислительных ресурсов для проведения, однако может масштабироваться на большое количество игроков.

The training format is not limited in time, does not require much computational resources, but can scale to accommodate a lot of participants.

Система запускает виртуальные машины участников по требованию, что экономит ресурсы организаторов во время низкой активности, и позволяет проводить такие тренировки бессрочно.

The system runs virtual machines for participants on-demand, which saves resources of organizers and mitigates time-limited nature of Attack-Defence CTF.

Для защиты от атак других участников, участники имеют возможность сохранить образ своей виртуальной машины в системе.  В таком случае, система выключит их виртуальную машину и сохранит её образ в облако, исользуя обьектное хранилище (S3).

To defend their virtual machine, a participant could submit a new snapshot of their machine to the system. The system then turns the machine off ans saves it to the cloud using object-storage (S3).  

Система проводит атаки участников автоматически, запуская виртуальные машины других участников для атаки. 

The system runs attacks of each participant automatically, which require running virtual machines of other participants.

Это снимает с участников необходимость поддерживать свою систему автоматизации, что упрощает игру для начинающих участников.

This removes the burden of automating attacks from participants, which eases competition for beginner players. 

Навыки, приобретенные участниками в ходе таких тренировок применимы на Attack-Defence CTF, так как разработка эксплойтов и защит от уязвимостей ведется в аналогичном формате.

Skills learned in such training are applicable to Attack-Defence CTF, because exploiting and defending are done in a similar format.
"""

i = input.split("\n")
i = [x.strip() for x in i if x.strip() != ""]

print("Abstract:\n", " ".join(i[1::2]))
print()
print("Реферат:\n", " ".join(i[0::2]))
