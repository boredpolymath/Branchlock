import unittest
from server import parse_repository, scan_workflow, ScanError


class ScannerTest(unittest.TestCase):
    def test_accepts_owner_repository_and_github_url(self):
        self.assertEqual(parse_repository("octo-labs/payment-service"), ("octo-labs", "payment-service"))
        self.assertEqual(parse_repository("https://github.com/octo-labs/payment-service"), ("octo-labs", "payment-service"))

    def test_rejects_non_github_input(self):
        with self.assertRaises(ScanError):
            parse_repository("https://example.com/a/b")

    def test_detects_and_redacts_workflow_risks(self):
        findings = scan_workflow("ci.yml", "permissions: write-all\nuses: acme/action@v1\nrun: echo ${{ github.event.pull_request.title }}\nTOKEN: keep-me-hidden")
        self.assertEqual([finding["id"] for finding in findings], ["WG-004", "WG-021", "WG-012"])
        self.assertTrue(all("keep-me-hidden" not in finding["evidence"] for finding in findings))


if __name__ == "__main__":
    unittest.main()
