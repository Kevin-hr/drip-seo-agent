anchor_id = 7688852937824570642
anchor_days = 24

week2_candidates = [
    (7684203682275118356, 'decoded 9-14'),
    (7685100505810439445, 'verified 9-14'),
    (7685269299539234068, 'verified 9-14'),
    (7686176877182061838, 'verified 9-17'),
    (7686246617862671636, 'verified 9-17'),
    (7686860121267244310, 'verified 9-18'),
    (7687442051310406942, 'verified 9-20'),
    (7687581316992290069, 'boundary'),
]

other = [
    (7683709643327016223, 'verified 9-10'),
    (7683116209859988767, 'decoded 9-11'),
]

print("=== Week 2 candidates ===")
for vid, note in week2_candidates:
    diff = ((vid >> 22) - (anchor_id >> 22)) / 1000 / 86400
    est = anchor_days + diff
    in_range = 14 <= est <= 20.999
    status = "IN WEEK 2" if in_range else "OUT"
    print(f"  ~9-{est:.1f}  {vid}  {note}  [{status}]")

print()
print("=== Just before Week 2 ===")
for vid, note in other:
    diff = ((vid >> 22) - (anchor_id >> 22)) / 1000 / 86400
    est = anchor_days + diff
    print(f"  ~9-{est:.1f}  {vid}  {note}")

# Week 1 count
print()
print("=== Final counts ===")
